/**
 * Storage Abstraction Layer
 * Provides a unified interface for file operations that can be easily adapted
 * for different storage backends (local filesystem, S3, Azure Blob, etc.)
 */

import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export interface StorageConfig {
  type: 'local' | 's3' | 'azure' | 'gcs'
  basePath?: string
  maxFileSize?: number
  allowedExtensions?: string[]
}

export interface StorageFile {
  id: string
  name: string
  originalName: string
  path: string
  size: number
  mimeType: string
  extension: string
  uploadedAt: Date
}

export interface StorageUploadOptions {
  originalName: string
  content: Buffer | ArrayBuffer
  mimeType?: string
  category?: string // e.g., 'market-snapshot', 'test-scripts', 'optimization-models'
  preserveName?: boolean
}

export interface StorageProvider {
  save(options: StorageUploadOptions): Promise<StorageFile>
  read(fileId: string): Promise<Buffer>
  delete(fileId: string): Promise<boolean>
  exists(fileId: string): Promise<boolean>
  getPublicUrl?(fileId: string): Promise<string>
  createUploadDirectory(category: string): Promise<void>
}

class LocalStorageProvider implements StorageProvider {
  private basePath: string
  private maxFileSize: number
  private allowedExtensions: string[]

  constructor(config: StorageConfig) {
    this.basePath = config.basePath || path.join(process.cwd(), 'uploads')
    this.maxFileSize = config.maxFileSize || 100 * 1024 * 1024 // 100MB default
    this.allowedExtensions = config.allowedExtensions || [
      '.xlsx', '.xls', '.csv', '.json', '.py', '.txt', '.pdf'
    ]
  }

  async createUploadDirectory(category: string): Promise<void> {
    const dirPath = path.join(this.basePath, category)
    await fs.mkdir(dirPath, { recursive: true })
  }

  async save(options: StorageUploadOptions): Promise<StorageFile> {
    const { originalName, content, mimeType, category = 'general', preserveName = false } = options
    
    // Validate file size
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content)
    if (buffer.length > this.maxFileSize) {
      throw new Error(`File size ${buffer.length} exceeds maximum allowed size ${this.maxFileSize}`)
    }

    // Validate file extension
    const extension = path.extname(originalName).toLowerCase()
    if (this.allowedExtensions.length > 0 && !this.allowedExtensions.includes(extension)) {
      throw new Error(`File extension ${extension} is not allowed`)
    }

    // Sanitize filename
    const sanitizedOriginalName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_')
    
    // Generate unique filename
    const fileId = uuidv4()
    const fileName = preserveName 
      ? sanitizedOriginalName
      : `${Date.now()}_${fileId}_${sanitizedOriginalName}`

    // Ensure category directory exists
    await this.createUploadDirectory(category)

    // Build file path
    const filePath = path.join(this.basePath, category, fileName)

    // Save file
    await fs.writeFile(filePath, buffer)

    // Create storage file record
    const storageFile: StorageFile = {
      id: fileId,
      name: fileName,
      originalName,
      path: filePath,
      size: buffer.length,
      mimeType: mimeType || 'application/octet-stream',
      extension,
      uploadedAt: new Date()
    }

    return storageFile
  }

  async read(fileId: string): Promise<Buffer> {
    // Find file by ID (search in all categories)
    const file = await this.findFileById(fileId)
    if (!file) {
      throw new Error(`File with ID ${fileId} not found`)
    }

    return fs.readFile(file.path)
  }

  async delete(fileId: string): Promise<boolean> {
    try {
      const file = await this.findFileById(fileId)
      if (!file) {
        return false
      }

      await fs.unlink(file.path)
      return true
    } catch (error) {
      console.error(`Error deleting file ${fileId}:`, error)
      return false
    }
  }

  async exists(fileId: string): Promise<boolean> {
    try {
      const file = await this.findFileById(fileId)
      if (!file) return false

      await fs.access(file.path)
      return true
    } catch {
      return false
    }
  }

  private async findFileById(fileId: string): Promise<{ path: string } | null> {
    try {
      const categories = await fs.readdir(this.basePath)
      
      for (const category of categories) {
        const categoryPath = path.join(this.basePath, category)
        const stat = await fs.stat(categoryPath)
        
        if (!stat.isDirectory()) continue

        const files = await fs.readdir(categoryPath)
        const matchingFile = files.find(f => f.includes(fileId))
        
        if (matchingFile) {
          return { path: path.join(categoryPath, matchingFile) }
        }
      }
      
      return null
    } catch {
      return null
    }
  }
}

// Storage configuration
const storageConfig: StorageConfig = {
  type: 'local',
  basePath: process.env.STORAGE_PATH || path.join(process.cwd(), 'uploads'),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600'), // 100MB
  allowedExtensions: [
    '.xlsx', '.xls', '.csv', '.json', 
    '.py', '.txt', '.pdf', '.zip',
    '.png', '.jpg', '.jpeg'
  ]
}

// Storage provider instance
let storageProvider: StorageProvider | null = null

/**
 * Get the configured storage provider instance
 */
export function getStorage(): StorageProvider {
  if (!storageProvider) {
    switch (storageConfig.type) {
      case 'local':
        storageProvider = new LocalStorageProvider(storageConfig)
        break
      // Future: Add S3, Azure, GCS providers
      default:
        storageProvider = new LocalStorageProvider(storageConfig)
    }
  }
  return storageProvider
}

/**
 * Utility function to save uploaded file from FormData
 */
export async function saveUploadedFile(
  file: File, 
  category: string,
  options: Partial<StorageUploadOptions> = {}
): Promise<StorageFile> {
  const storage = getStorage()
  const buffer = Buffer.from(await file.arrayBuffer())
  
  return storage.save({
    originalName: file.name,
    content: buffer,
    mimeType: file.type,
    category,
    ...options
  })
}

/**
 * Utility function to clean up temp files on error
 */
export async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath)
  } catch (error) {
    console.warn(`Failed to cleanup temp file ${filePath}:`, error)
  }
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  totalFiles: number
  totalSize: number
  categorySizes: Record<string, number>
}> {
  const storage = getStorage() as LocalStorageProvider
  const stats = {
    totalFiles: 0,
    totalSize: 0,
    categorySizes: {} as Record<string, number>
  }

  try {
    const basePath = storageConfig.basePath || path.join(process.cwd(), 'uploads')
    const categories = await fs.readdir(basePath)

    for (const category of categories) {
      const categoryPath = path.join(basePath, category)
      const stat = await fs.stat(categoryPath)
      
      if (!stat.isDirectory()) continue

      const files = await fs.readdir(categoryPath)
      let categorySize = 0

      for (const file of files) {
        const filePath = path.join(categoryPath, file)
        const fileStat = await fs.stat(filePath)
        categorySize += fileStat.size
      }

      stats.categorySizes[category] = categorySize
      stats.totalFiles += files.length
      stats.totalSize += categorySize
    }
  } catch (error) {
    console.error('Error calculating storage stats:', error)
  }

  return stats
}

export default getStorage