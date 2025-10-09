import { db } from './db'

export type NotificationType = 'alert' | 'warning' | 'update' | 'info'
export type NotificationCategory = 'system' | 'data' | 'optimization' | 'security'
export type NotificationSeverity = 'critical' | 'high' | 'medium' | 'low'

export interface CreateNotificationOptions {
  type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  severity?: NotificationSeverity
  action_url?: string
  action_label?: string
  metadata?: Record<string, any>
  user_id?: string
}

export async function createNotification(options: CreateNotificationOptions) {
  try {
    const notification = await db.notification.create({
      data: {
        type: options.type,
        category: options.category,
        title: options.title,
        message: options.message,
        severity: options.severity || 'low',
        action_url: options.action_url,
        action_label: options.action_label,
        metadata: options.metadata || {},
        user_id: options.user_id
      }
    })
    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

export type ActivityType = 'data_upload' | 'optimization' | 'chart' | 'system'
export type ActivityAction = 'created' | 'updated' | 'deleted' | 'executed'
export type ActivityStatus = 'success' | 'failed' | 'pending'

export interface CreateActivityOptions {
  type: ActivityType
  action: ActivityAction
  title: string
  description?: string
  entity_type?: string
  entity_id?: string
  user_id?: string
  status?: ActivityStatus
  metadata?: Record<string, any>
}

export async function createActivity(options: CreateActivityOptions) {
  try {
    const activity = await db.activity.create({
      data: {
        type: options.type,
        action: options.action,
        title: options.title,
        description: options.description,
        entity_type: options.entity_type,
        entity_id: options.entity_id,
        user_id: options.user_id,
        status: options.status || 'success',
        metadata: options.metadata || {}
      }
    })
    return activity
  } catch (error) {
    console.error('Error creating activity:', error)
    throw error
  }
}

// Convenience functions for common notification scenarios

export async function notifyOptimizationComplete(jobId: string, modelType: string, status: 'success' | 'failed') {
  const isSuccess = status === 'success'
  
  await createNotification({
    type: isSuccess ? 'update' : 'alert',
    category: 'optimization',
    title: `${modelType} Optimization ${isSuccess ? 'Complete' : 'Failed'}`,
    message: `${modelType} optimization job ${jobId} has ${isSuccess ? 'completed successfully' : 'failed'}`,
    severity: isSuccess ? 'low' : 'high',
    action_url: `/api/jobs/${jobId}`,
    action_label: 'View Details',
    metadata: { job_id: jobId, model_type: modelType, status }
  })

  await createActivity({
    type: 'optimization',
    action: 'executed',
    title: `${modelType} Optimization ${isSuccess ? 'Completed' : 'Failed'}`,
    description: `Job ID: ${jobId}`,
    entity_type: 'JobRun',
    entity_id: jobId,
    status,
    metadata: { model_type: modelType }
  })
}

export async function notifyDataUpload(fileName: string, recordCount: number, status: 'success' | 'failed') {
  const isSuccess = status === 'success'
  
  await createNotification({
    type: isSuccess ? 'update' : 'warning',
    category: 'data',
    title: `Data Upload ${isSuccess ? 'Complete' : 'Failed'}`,
    message: `File "${fileName}" has been ${isSuccess ? `uploaded successfully with ${recordCount} records` : 'failed to upload'}`,
    severity: isSuccess ? 'low' : 'medium',
    metadata: { file_name: fileName, record_count: recordCount, status }
  })

  await createActivity({
    type: 'data_upload',
    action: 'created',
    title: `Uploaded ${fileName}`,
    description: isSuccess ? `${recordCount} records imported` : 'Upload failed',
    status,
    metadata: { file_name: fileName, record_count: recordCount }
  })
}

export async function notifyDataQualityIssue(message: string, severity: NotificationSeverity, affectedRecords: number) {
  await createNotification({
    type: 'warning',
    category: 'data',
    title: 'Data Quality Issue Detected',
    message,
    severity,
    metadata: { affected_records: affectedRecords }
  })
}

export async function notifySystemAlert(title: string, message: string, severity: NotificationSeverity) {
  await createNotification({
    type: 'alert',
    category: 'system',
    title,
    message,
    severity,
    metadata: { timestamp: new Date().toISOString() }
  })

  await createActivity({
    type: 'system',
    action: 'created',
    title: 'System Alert',
    description: message,
    status: 'pending',
    metadata: { severity }
  })
}

export async function notifyChartCreated(chartName: string, dataSourceId: string) {
  await createNotification({
    type: 'info',
    category: 'system',
    title: 'New Chart Created',
    message: `Chart "${chartName}" has been added to your dashboard`,
    severity: 'low',
    metadata: { chart_name: chartName, data_source_id: dataSourceId }
  })

  await createActivity({
    type: 'chart',
    action: 'created',
    title: `Created chart: ${chartName}`,
    entity_type: 'Chart',
    status: 'success',
    metadata: { data_source_id: dataSourceId }
  })
}
