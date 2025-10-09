/**
 * Centralized Error Handler
 * Provides consistent error handling, logging, and user-friendly messages
 */

import { NextResponse } from 'next/server';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

/**
 * Get user-friendly error message based on error type
 */
export function getUserFriendlyMessage(error: any): string {
  // Known error types
  if (error instanceof ValidationError) {
    return error.message;
  }
  
  if (error instanceof AuthenticationError) {
    return 'Please log in to continue';
  }
  
  if (error instanceof AuthorizationError) {
    return 'You don\'t have permission to perform this action';
  }
  
  if (error instanceof NotFoundError) {
    return error.message;
  }
  
  if (error instanceof RateLimitError) {
    return 'Too many requests. Please try again later';
  }
  
  // Database errors
  if (error.code === 'P2002') {
    return 'This record already exists';
  }
  
  if (error.code === 'P2025') {
    return 'Record not found';
  }
  
  // File upload errors
  if (error.message?.includes('File too large')) {
    return 'File is too large. Maximum size is 10MB';
  }
  
  if (error.message?.includes('Invalid file type')) {
    return 'Invalid file type. Please upload Excel or CSV files only';
  }
  
  // Network errors
  if (error.message?.includes('ECONNREFUSED')) {
    return 'Unable to connect to the server. Please try again';
  }
  
  if (error.message?.includes('timeout')) {
    return 'Request timed out. Please try again';
  }
  
  // Default message (don't expose internal errors)
  return 'An unexpected error occurred. Please try again';
}

/**
 * Log error details (in production, send to logging service)
 */
export function logError(error: any, context?: any) {
  const errorInfo = {
    name: error.name || 'Error',
    message: error.message,
    code: error.code,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  };
  
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 Error occurred:', errorInfo);
  }
  
  // In production, you would send to logging service (Sentry, LogRocket, etc.)
  // Example: Sentry.captureException(error, { contexts: { custom: context } });
  
  return errorInfo;
}

/**
 * Handle API route errors consistently
 */
export function handleApiError(error: any, context?: any): NextResponse {
  // Log the error
  logError(error, context);
  
  // Determine status code
  const statusCode = error.statusCode || error.status || 500;
  
  // Get user-friendly message
  const message = getUserFriendlyMessage(error);
  
  // Prepare response
  const response: any = {
    success: false,
    error: message,
    code: error.code,
  };
  
  // In development, include more details
  if (process.env.NODE_ENV === 'development') {
    response.details = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  
  return NextResponse.json(response, { status: statusCode });
}

/**
 * Async handler wrapper for API routes
 * Catches errors and handles them consistently
 */
export function asyncHandler(
  handler: (req: any, res?: any) => Promise<any>
) {
  return async (req: any, res?: any) => {
    try {
      return await handler(req, res);
    } catch (error) {
      return handleApiError(error, {
        url: req.url,
        method: req.method,
      });
    }
  };
}

/**
 * Validate required fields
 */
export function validateRequired(data: any, fields: string[]) {
  const missing = fields.filter(field => !data[field]);
  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      { missingFields: missing }
    );
  }
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: File, options?: {
  maxSize?: number;
  allowedTypes?: string[];
}) {
  const maxSize = options?.maxSize || 10 * 1024 * 1024; // 10MB default
  const allowedTypes = options?.allowedTypes || [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
  ];
  
  if (!file) {
    throw new ValidationError('No file provided');
  }
  
  if (file.size > maxSize) {
    throw new ValidationError(
      `File too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB`,
      { maxSize, actualSize: file.size }
    );
  }
  
  if (!allowedTypes.includes(file.type)) {
    throw new ValidationError(
      'Invalid file type. Only Excel and CSV files are supported',
      { allowedTypes, actualType: file.type }
    );
  }
}

/**
 * Retry logic for async operations
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    delay?: number;
    backoff?: boolean;
  }
): Promise<T> {
  const maxRetries = options?.maxRetries || 3;
  const baseDelay = options?.delay || 1000;
  const useBackoff = options?.backoff ?? true;
  
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on validation or authorization errors
      if (
        error instanceof ValidationError ||
        error instanceof AuthenticationError ||
        error instanceof AuthorizationError
      ) {
        throw error;
      }
      
      // Last attempt, throw error
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      // Wait before retrying
      const delay = useBackoff ? baseDelay * Math.pow(2, attempt) : baseDelay;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
    }
  }
  
  throw lastError;
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    logError(error, { json });
    return fallback;
  }
}

/**
 * Sanitize error message for client
 * Remove sensitive information like file paths, database details, etc.
 */
export function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/\/[^\s]+/g, '[PATH]') // Remove file paths
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]') // Remove IP addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]') // Remove emails
    .replace(/(?:password|token|secret|key)\s*[:=]\s*\S+/gi, '[REDACTED]'); // Remove secrets
}
