import { Server } from 'socket.io';
import { db } from './db';
import { OptimizationExecutor } from './optimization-executor';
import { TestScriptExecutor } from './test-script-executor';

let kpiUpdateInterval: NodeJS.Timeout | null = null;
let notificationCheckInterval: NodeJS.Timeout | null = null;
let systemHealthInterval: NodeJS.Timeout | null = null;
let optimizationExecutor: OptimizationExecutor | null = null;
let testScriptExecutor: TestScriptExecutor | null = null;
let globalIo: Server | null = null;

export const setupSocket = (io: Server) => {
  console.log('🚀 Socket.IO server initialized');

  // Keep a global reference for API routes to use
  globalIo = io;

  // Initialize optimization executor
  optimizationExecutor = new OptimizationExecutor(io);
  
  // Initialize test script executor
  testScriptExecutor = new TestScriptExecutor(io);

  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);
    
    // Join dashboard room for real-time updates
    socket.join('dashboard');
    socket.join('optimization'); // Auto-join optimization room
    
    // Send initial connection confirmation
    socket.emit('connected', {
      message: 'Real-time connection established',
      timestamp: new Date().toISOString(),
      features: ['kpi-updates', 'notifications', 'system-health', 'activity-feed', 'optimization-logs']
    });

    // Subscribe to specific update channels
    socket.on('subscribe', (channel: string) => {
      socket.join(channel);
      console.log(`📡 Client ${socket.id} subscribed to ${channel}`);
    });

    socket.on('unsubscribe', (channel: string) => {
      socket.leave(channel);
      console.log(`📴 Client ${socket.id} unsubscribed from ${channel}`);
    });

    // Optimization-specific subscriptions
    socket.on('optimization:subscribe', (data: { jobId?: string; modelType?: string }) => {
      const { jobId, modelType } = data;
      if (jobId) {
        socket.join(`job:${jobId}`);
        console.log(`📊 Client ${socket.id} subscribed to job ${jobId}`);
      }
      if (modelType) {
        socket.join(`model:${modelType}`);
        console.log(`📊 Client ${socket.id} subscribed to ${modelType} model`);
      }
    });

    socket.on('optimization:unsubscribe', (data: { jobId?: string; modelType?: string }) => {
      const { jobId, modelType } = data;
      if (jobId) socket.leave(`job:${jobId}`);
      if (modelType) socket.leave(`model:${modelType}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });

  // Start real-time update intervals
  startRealtimeUpdates(io);

  // Cleanup on server shutdown
  process.on('SIGINT', () => {
    stopRealtimeUpdates();
  });
};

function startRealtimeUpdates(io: Server) {
  // KPI Updates - Every 30 seconds
  kpiUpdateInterval = setInterval(async () => {
    try {
      const kpiData = await fetchKpiData();
      io.to('dashboard').emit('kpi:update', {
        data: kpiData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    }
  }, 30000);

  // Notification Checks - Every 10 seconds
  notificationCheckInterval = setInterval(async () => {
    try {
      const newNotifications = await checkNewNotifications();
      if (newNotifications.length > 0) {
        io.to('dashboard').emit('notification:new', {
          notifications: newNotifications,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  }, 10000);

  // System Health - Every 15 seconds
  systemHealthInterval = setInterval(async () => {
    try {
      const healthData = await fetchSystemHealth();
      io.to('dashboard').emit('system-health:update', {
        data: healthData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching system health:', error);
    }
  }, 15000);

  console.log('⏰ Real-time update intervals started');
}

function stopRealtimeUpdates() {
  if (kpiUpdateInterval) clearInterval(kpiUpdateInterval);
  if (notificationCheckInterval) clearInterval(notificationCheckInterval);
  if (systemHealthInterval) clearInterval(systemHealthInterval);
  console.log('⏹️  Real-time update intervals stopped');
}

// Helper function to fetch KPI data
async function fetchKpiData() {
  // Fetch real KPI data from database
  const dataSources = await db.dataSource.count();
  const totalRecords = await db.dataSourceColumn.count();
  
  return {
    total_capacity: { value: 450000, unit: 'MW', change: 2.5, trend: [440, 445, 448, 450] },
    active_generation: { value: 285000, unit: 'MW', change: 5.2, trend: [270, 275, 280, 285] },
    grid_load: { value: 195000, unit: 'MW', change: -1.3, trend: [198, 197, 196, 195] },
    market_price: { value: 3250, unit: '₹/MWh', change: -3.8, trend: [3380, 3320, 3280, 3250] },
    data_sources: dataSources,
    total_records: totalRecords
  };
}

// Helper function to check for new notifications
async function checkNewNotifications() {
  const recentNotifications = await db.notification.findMany({
    where: {
      created_at: {
        gte: new Date(Date.now() - 10000) // Last 10 seconds
      }
    },
    orderBy: { created_at: 'desc' },
    take: 10
  });
  
  return recentNotifications;
}

// Helper function to fetch system health
async function fetchSystemHealth() {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  return {
    status: 'healthy',
    uptime: uptime,
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024),
      total: Math.round(memUsage.heapTotal / 1024 / 1024),
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
    },
    api_response_time: Math.random() * 100 + 50, // Mock data
    database_connections: 5 // Mock data
  };
}

// Export function to emit events from API routes
export function emitSocketEvent(io: Server, event: string, data: any) {
  io.to('dashboard').emit(event, data);
}

// Export optimization executor getter
export function getOptimizationExecutor(): OptimizationExecutor | null {
  return optimizationExecutor;
}

// Export test script executor getter
export function getTestScriptExecutor(): TestScriptExecutor | null {
  return testScriptExecutor;
}

// Export Socket.IO instance getter for API routes
export function getIo(): Server | null {
  return globalIo;
}

// Helper to safely emit events (noop if socket not initialized)
export function emitToRoom(room: string, event: string, data: any) {
  if (globalIo) {
    globalIo.to(room).emit(event, data);
    console.log(`📡 Emitted ${event} to room ${room}`);
  } else {
    console.warn('⚠️ Socket.IO not initialized, cannot emit event');
  }
}
