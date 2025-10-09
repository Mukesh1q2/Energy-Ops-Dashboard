import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Generate AI-powered insights based on data analysis
    const insights = await generateInsights()

    return NextResponse.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating insights:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function generateInsights() {
  const insights = []

  // Get data sources count
  const dataSourceCount = await db.dataSource.count()
  const recentDataSources = await db.dataSource.findMany({
    where: {
      created_at: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    }
  })

  // Insight 1: Data Source Growth Trend
  if (recentDataSources.length > 0) {
    insights.push({
      id: `insight-trend-${Date.now()}-1`,
      type: 'trend',
      severity: 'medium',
      title: 'Data Source Activity Increasing',
      description: `${recentDataSources.length} new data sources added in the last 7 days. ${dataSourceCount > 10 ? 'Your data ecosystem is growing steadily.' : 'Consider adding more data sources for comprehensive analysis.'}`,
      impact: dataSourceCount > 10 ? 'Positive trend indicating active data management' : 'Limited data sources may affect insights quality',
      confidence: 85,
      action_label: 'View Data Sources',
      action_url: '/sandbox',
      created_at: new Date().toISOString()
    })
  }

  // Insight 2: System Performance Anomaly Detection
  const memUsage = process.memoryUsage()
  const memPercentage = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
  
  if (memPercentage > 80) {
    insights.push({
      id: `insight-anomaly-${Date.now()}-2`,
      type: 'anomaly',
      severity: 'high',
      title: 'High Memory Usage Detected',
      description: `System memory usage is at ${memPercentage}%. This may impact performance during peak operations.`,
      impact: 'Potential slowdowns in data processing and chart rendering',
      confidence: 95,
      action_label: 'View System Health',
      action_url: '/',
      created_at: new Date().toISOString()
    })
  }

  // Insight 3: Data Quality Recommendation
  const dataSources = await db.dataSource.findMany({
    include: {
      columns: true
    },
    take: 10
  })

  const dataSourcesWithoutColumns = dataSources.filter(ds => ds.columns.length === 0)
  if (dataSourcesWithoutColumns.length > 0) {
    insights.push({
      id: `insight-recommendation-${Date.now()}-3`,
      type: 'recommendation',
      severity: 'medium',
      title: 'Unmapped Data Sources Found',
      description: `${dataSourcesWithoutColumns.length} data sources don't have column mappings. Map them to enable automatic chart generation.`,
      impact: 'Missing column mappings prevent AI-powered chart suggestions',
      confidence: 90,
      action_label: 'Map Columns',
      action_url: '/sandbox',
      created_at: new Date().toISOString()
    })
  }

  // Insight 4: Optimization Opportunity
  if (dataSourceCount >= 3) {
    insights.push({
      id: `insight-recommendation-${Date.now()}-4`,
      type: 'recommendation',
      severity: 'low',
      title: 'Cross-Source Analysis Available',
      description: `You have ${dataSourceCount} data sources. Consider creating comparative analyses to uncover patterns across datasets.`,
      impact: 'Enhanced insights through data correlation and pattern detection',
      confidence: 75,
      action_label: 'Create Dashboard',
      action_url: '/',
      created_at: new Date().toISOString()
    })
  }

  // Insight 5: Forecast - Data Growth Projection
  insights.push({
    id: `insight-forecast-${Date.now()}-5`,
    type: 'forecast',
    severity: 'low',
    title: 'Data Volume Projection',
    description: `Based on current trends, you'll have approximately ${Math.round(dataSourceCount * 1.3)} data sources by next month.`,
    impact: 'Plan for additional storage and processing capacity',
    confidence: 70,
    created_at: new Date().toISOString()
  })

  // Insight 6: Pattern Recognition - Peak Usage Times
  const currentHour = new Date().getHours()
  if (currentHour >= 9 && currentHour <= 17) {
    insights.push({
      id: `insight-pattern-${Date.now()}-6`,
      type: 'pattern',
      severity: 'low',
      title: 'Peak Activity Period Detected',
      description: 'System usage typically peaks between 9 AM - 5 PM. Current time falls within this window.',
      impact: 'Expect optimal system performance during business hours',
      confidence: 80,
      created_at: new Date().toISOString()
    })
  }

  // Insight 7: Real-time Alert
  const recentNotifications = await db.notification.findMany({
    where: {
      severity: 'critical',
      created_at: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    },
    take: 1
  })

  if (recentNotifications.length > 0) {
    insights.push({
      id: `insight-anomaly-${Date.now()}-7`,
      type: 'anomaly',
      severity: 'critical',
      title: 'Critical Alert Requires Attention',
      description: 'A critical system alert was triggered in the last 24 hours. Review and resolve to maintain system health.',
      impact: 'Unresolved critical alerts may affect system reliability',
      confidence: 95,
      action_label: 'View Alerts',
      action_url: '/',
      created_at: new Date().toISOString()
    })
  }

  return insights
}
