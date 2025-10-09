import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  const startTime = Date.now()
  
  try {
    // 1. Database Health Check
    const dbStartTime = Date.now()
    let dbStatus = 'healthy'
    let dbLatency = 0
    let dbError = null

    try {
      await prisma.$queryRaw`SELECT 1`
      dbLatency = Date.now() - dbStartTime
      
      if (dbLatency > 1000) {
        dbStatus = 'slow'
      } else if (dbLatency > 500) {
        dbStatus = 'degraded'
      }
    } catch (error) {
      dbStatus = 'unhealthy'
      dbError = error instanceof Error ? error.message : 'Unknown error'
    }

    // 2. Database Connection Pool Info
    const connectionCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'
    ` as any[]
    
    // Convert BigInt to Number for JSON serialization
    const tableCount = Number(connectionCount[0]?.count || 0)
    
    // 3. Data Source Health
    const dataSources = await prisma.dataSource.findMany({
      select: {
        status: true,
        last_sync: true
      }
    })

    const dataSourceHealth = {
      total: dataSources.length,
      connected: dataSources.filter(ds => ds.status === 'connected').length,
      disconnected: dataSources.filter(ds => ds.status === 'disconnected').length,
      error: dataSources.filter(ds => ds.status === 'error').length,
      stale: dataSources.filter(ds => {
        if (!ds.last_sync) return false
        const hoursSinceSync = (Date.now() - new Date(ds.last_sync).getTime()) / (1000 * 60 * 60)
        return hoursSinceSync > 24
      }).length
    }

    // 4. Job Queue Status
    const activeJobs = await prisma.jobRun.count({
      where: {
        status: { in: ['pending', 'running'] }
      }
    })

    const pendingJobs = await prisma.jobRun.count({
      where: { status: 'pending' }
    })

    const runningJobs = await prisma.jobRun.count({
      where: { status: 'running' }
    })

    // Recent job stats (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentJobStats = await prisma.jobRun.groupBy({
      by: ['status'],
      where: {
        started_at: { gte: oneHourAgo }
      },
      _count: true
    })

    const recentJobCounts = recentJobStats.reduce((acc, stat) => {
      acc[stat.status] = stat._count
      return acc
    }, {} as Record<string, number>)

    // 5. Storage/Data Metrics
    const totalRecords = await Promise.all([
      prisma.electricityData.count(),
      prisma.dMOGeneratorScheduling.count(),
      prisma.dMOContractScheduling.count(),
      prisma.dMOMarketBidding.count(),
      prisma.optimizationResult.count()
    ])

    const totalDataPoints = totalRecords.reduce((sum, count) => sum + count, 0)

    // Recent uploads (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentUploads = await prisma.uploadedFile.groupBy({
      by: ['status'],
      where: {
        created_at: { gte: oneDayAgo }
      },
      _count: true,
      _sum: { file_size: true }
    })

    const uploadStats = recentUploads.reduce((acc, upload) => {
      acc[upload.status] = {
        count: upload._count,
        totalSize: upload._sum.file_size || 0
      }
      return acc
    }, {} as Record<string, { count: number, totalSize: number }>)

    // 6. API Performance Metrics
    const apiLatency = Date.now() - startTime

    // 7. Recent Notifications/Alerts
    const unreadAlerts = await prisma.notification.count({
      where: {
        is_read: false,
        severity: { in: ['critical', 'high'] }
      }
    })

    const criticalAlerts = await prisma.notification.count({
      where: {
        is_read: false,
        severity: 'critical'
      }
    })

    // 8. Database Endpoint Health (if configured)
    const dbConnectionsHealth = await prisma.databaseConnection.groupBy({
      by: ['status'],
      _count: true
    })

    const dbConnectionStats = dbConnectionsHealth.reduce((acc, conn) => {
      acc[conn.status] = conn._count
      return acc
    }, {} as Record<string, number>)

    // 9. API Endpoints Health
    const apiEndpoints = await prisma.apiEndpoint.findMany({
      select: {
        status: true,
        response_time: true,
        last_called: true
      }
    })

    const apiEndpointHealth = {
      total: apiEndpoints.length,
      active: apiEndpoints.filter(ep => ep.status === 'active').length,
      inactive: apiEndpoints.filter(ep => ep.status === 'inactive').length,
      error: apiEndpoints.filter(ep => ep.status === 'error').length,
      avgResponseTime: apiEndpoints.length > 0
        ? apiEndpoints.reduce((sum, ep) => sum + (ep.response_time || 0), 0) / apiEndpoints.length
        : 0
    }

    // 10. Overall System Status
    let overallStatus = 'healthy'
    const issues: string[] = []

    if (dbStatus !== 'healthy') {
      overallStatus = 'degraded'
      issues.push(`Database: ${dbStatus}`)
    }

    if (dataSourceHealth.error > 0) {
      overallStatus = dataSourceHealth.error > dataSourceHealth.total / 2 ? 'critical' : 'degraded'
      issues.push(`${dataSourceHealth.error} data sources in error state`)
    }

    if (criticalAlerts > 0) {
      overallStatus = 'critical'
      issues.push(`${criticalAlerts} critical alerts unread`)
    }

    if (activeJobs > 50) {
      overallStatus = overallStatus === 'healthy' ? 'degraded' : overallStatus
      issues.push(`High job queue: ${activeJobs} active jobs`)
    }

    // Convert all values to ensure JSON serialization compatibility
    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      issues,
      database: {
        status: dbStatus,
        latency: Number(dbLatency),
        error: dbError,
        tableCount: Number(tableCount)
      },
      dataSources: {
        total: Number(dataSourceHealth.total),
        connected: Number(dataSourceHealth.connected),
        disconnected: Number(dataSourceHealth.disconnected),
        error: Number(dataSourceHealth.error),
        stale: Number(dataSourceHealth.stale)
      },
      jobQueue: {
        active: Number(activeJobs),
        pending: Number(pendingJobs),
        running: Number(runningJobs),
        recentStats: Object.fromEntries(
          Object.entries(recentJobCounts).map(([k, v]) => [k, Number(v)])
        )
      },
      storage: {
        totalRecords: Number(totalDataPoints),
        breakdown: {
          electricity: Number(totalRecords[0]),
          generatorScheduling: Number(totalRecords[1]),
          contractScheduling: Number(totalRecords[2]),
          marketBidding: Number(totalRecords[3]),
          optimizationResults: Number(totalRecords[4])
        },
        recentUploads: Object.fromEntries(
          Object.entries(uploadStats).map(([k, v]) => [
            k,
            { count: Number(v.count), totalSize: Number(v.totalSize) }
          ])
        )
      },
      api: {
        latency: Number(apiLatency),
        endpoints: {
          total: Number(apiEndpointHealth.total),
          active: Number(apiEndpointHealth.active),
          inactive: Number(apiEndpointHealth.inactive),
          error: Number(apiEndpointHealth.error),
          avgResponseTime: Number(apiEndpointHealth.avgResponseTime)
        }
      },
      alerts: {
        unread: Number(unreadAlerts),
        critical: Number(criticalAlerts)
      },
      externalConnections: {
        databases: Object.fromEntries(
          Object.entries(dbConnectionStats).map(([k, v]) => [k, Number(v)])
        ),
        total: Number(Object.values(dbConnectionStats).reduce((sum, val) => sum + val, 0))
      },
      memory: {
        used: Number(process.memoryUsage().heapUsed),
        total: Number(process.memoryUsage().heapTotal),
        rss: Number(process.memoryUsage().rss),
        external: Number(process.memoryUsage().external)
      }
    }

    return NextResponse.json({
      success: true,
      data: response
    })
  } catch (error) {
    console.error('System Health Check Error:', error)
    return NextResponse.json(
      {
        success: false,
        status: 'error',
        error: 'Failed to perform health check',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
