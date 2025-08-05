// Enhanced Error Handling Service
import { logError } from './firebase';
import analytics from './analytics';
import { ERROR_TYPES, MESSAGES } from '../utils/constants';
import { getErrorMessage } from '../utils/helpers';

class ErrorHandler {
  constructor() {
    this.sessionId = null;
    this.errorHistory = [];
    this.errorHandlers = new Map();
    this.setupGlobalErrorHandlers();
  }

  // Initialize error handler for session
  initialize(sessionId) {
    this.sessionId = sessionId;
  }

  // Setup global error handlers
  setupGlobalErrorHandlers() {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), 'global_error', 'error');
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        new Error(event.reason || 'Unhandled promise rejection'), 
        'unhandled_promise', 
        'error'
      );
    });

    // Handle network errors
    window.addEventListener('online', () => {
      this.handleNetworkStatusChange(true);
    });

    window.addEventListener('offline', () => {
      this.handleNetworkStatusChange(false);
    });
  }

  // Main error handling method
  async handleError(error, context = '', severity = 'error', userVisible = true) {
    const errorInfo = this.processError(error, context, severity);
    
    // Add to error history
    this.errorHistory.push(errorInfo);
    
    // Keep only last 50 errors
    if (this.errorHistory.length > 50) {
      this.errorHistory = this.errorHistory.slice(-50);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Handler: ${severity.toUpperCase()}`);
      console.error('Error:', error);
      console.log('Context:', context);
      console.log('Processed:', errorInfo);
      console.groupEnd();
    }

    // Log to Firebase
    try {
      await logError(this.sessionId, error, context);
    } catch (logErr) {
      console.warn('Failed to log error to Firebase:', logErr);
    }

    // Track in analytics
    analytics.trackError(error, context, severity);

    // Execute custom error handlers
    this.executeErrorHandlers(errorInfo);

    // Return processed error for UI handling
    return errorInfo;
  }

  // Process error into standardized format
  processError(error, context, severity) {
    const errorMessage = getErrorMessage(error);
    const errorType = this.determineErrorType(error);
    
    return {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type: errorType,
      message: errorMessage,
      originalError: error,
      context,
      severity,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.sessionId,
      stackTrace: error?.stack || '',
      recoverable: this.isRecoverable(errorType),
      retryable: this.isRetryable(errorType),
      userMessage: this.getUserMessage(errorType, errorMessage)
    };
  }

  // Determine error type based on error characteristics
  determineErrorType(error) {
    if (!error) return ERROR_TYPES.UNKNOWN;

    const errorName = error.name?.toLowerCase() || '';
    const errorMessage = error.message?.toLowerCase() || '';

    // Permission errors
    if (errorName === 'notallowederror' || errorMessage.includes('permission')) {
      return ERROR_TYPES.PERMISSION_DENIED;
    }

    // Device errors
    if (errorName === 'notfounderror' || errorMessage.includes('no device')) {
      return ERROR_TYPES.NO_DEVICE;
    }

    // Browser support errors
    if (errorName === 'notsupportederror' || errorMessage.includes('not supported')) {
      return ERROR_TYPES.NOT_SUPPORTED;
    }

    // Constraint errors
    if (errorName === 'overconstrainederror') {
      return ERROR_TYPES.OVERCONSTRAINED;
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || 
        errorMessage.includes('connection')) {
      return ERROR_TYPES.NETWORK_ERROR;
    }

    // Upload errors
    if (errorMessage.includes('upload') || errorMessage.includes('storage')) {
      return ERROR_TYPES.UPLOAD_ERROR;
    }

    return 'general_error';
  }

  // Check if error is recoverable
  isRecoverable(errorType) {
    const recoverableErrors = [
      ERROR_TYPES.NETWORK_ERROR,
      ERROR_TYPES.UPLOAD_ERROR,
      ERROR_TYPES.PERMISSION_DENIED,
      'general_error'
    ];
    
    return recoverableErrors.includes(errorType);
  }

  // Check if error is retryable
  isRetryable(errorType) {
    const retryableErrors = [
      ERROR_TYPES.NETWORK_ERROR,
      ERROR_TYPES.UPLOAD_ERROR,
      'general_error'
    ];
    
    return retryableErrors.includes(errorType);
  }

  // Get user-friendly error message
  getUserMessage(errorType, originalMessage) {
    const errorMessages = {
      [ERROR_TYPES.PERMISSION_DENIED]: 'Please allow access to your camera and microphone to continue.',
      [ERROR_TYPES.NO_DEVICE]: 'No camera or microphone found. Please check your device connections.',
      [ERROR_TYPES.NOT_SUPPORTED]: 'Your browser doesn\'t support recording. Please try Chrome, Firefox, or Safari.',
      [ERROR_TYPES.OVERCONSTRAINED]: 'Your device doesn\'t support the required recording settings.',
      [ERROR_TYPES.NETWORK_ERROR]: 'Network connection issue. Please check your internet connection.',
      [ERROR_TYPES.UPLOAD_ERROR]: 'Failed to upload your recording. Please try again.',
      [ERROR_TYPES.SESSION_EXPIRED]: 'This recording link has expired.',
      [ERROR_TYPES.SESSION_COMPLETED]: 'This recording has already been completed.',
      [ERROR_TYPES.SESSION_REMOVED]: 'This recording has been removed.',
      [ERROR_TYPES.INVALID_URL]: 'Invalid recording link. Please check the URL.'
    };

    return errorMessages[errorType] || originalMessage || MESSAGES.ERRORS.GENERAL;
  }

  // Register custom error handler
  registerErrorHandler(errorType, handler) {
    if (!this.errorHandlers.has(errorType)) {
      this.errorHandlers.set(errorType, []);
    }
    this.errorHandlers.get(errorType).push(handler);
  }

  // Execute custom error handlers
  executeErrorHandlers(errorInfo) {
    const handlers = this.errorHandlers.get(errorInfo.type) || [];
    const globalHandlers = this.errorHandlers.get('*') || [];
    
    [...handlers, ...globalHandlers].forEach(handler => {
      try {
        handler(errorInfo);
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
      }
    });
  }

  // Handle network status changes
  handleNetworkStatusChange(isOnline) {
    if (!isOnline) {
      this.handleError(
        new Error('Network connection lost'),
        'network_status',
        'warning'
      );
    } else {
      // Retry failed operations when back online
      this.retryFailedOperations();
    }
  }

  // Retry failed operations
  async retryFailedOperations() {
    // This could trigger retries in other services
    if (typeof window.retryFailedUploads === 'function') {
      try {
        await window.retryFailedUploads();
      } catch (error) {
        console.warn('Failed to retry uploads:', error);
      }
    }

    // Retry analytics events
    analytics.retry();
  }

  // Get error statistics
  getErrorStats() {
    const stats = {
      total: this.errorHistory.length,
      byType: {},
      bySeverity: {},
      recentErrors: this.errorHistory.slice(-10)
    };

    this.errorHistory.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }

  // Clear error history
  clearHistory() {
    this.errorHistory = [];
  }

  // Check if there are recent critical errors
  hasRecentCriticalErrors(timeWindowMs = 60000) {
    const cutoff = Date.now() - timeWindowMs;
    return this.errorHistory.some(error => 
      new Date(error.timestamp).getTime() > cutoff && 
      error.severity === 'error'
    );
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

// Convenience functions for common error scenarios
export const errors = {
  // Core error handling
  handle: (error, context, severity, userVisible) => 
    errorHandler.handleError(error, context, severity, userVisible),
  
  // Specific error types
  handlePermissionError: (error) => 
    errorHandler.handleError(error, 'permission_request', 'error'),
  
  handleRecordingError: (error) => 
    errorHandler.handleError(error, 'recording_operation', 'error'),
  
  handleUploadError: (error) => 
    errorHandler.handleError(error, 'file_upload', 'error'),
  
  handleNetworkError: (error) => 
    errorHandler.handleError(error, 'network_operation', 'error'),
  
  handleValidationError: (error) => 
    errorHandler.handleError(error, 'data_validation', 'warning'),

  // Severity levels
  warning: (error, context) => 
    errorHandler.handleError(error, context, 'warning'),
  
  error: (error, context) => 
    errorHandler.handleError(error, context, 'error'),
  
  critical: (error, context) => 
    errorHandler.handleError(error, context, 'critical'),

  // Utility functions
  initialize: (sessionId) => errorHandler.initialize(sessionId),
  registerHandler: (type, handler) => errorHandler.registerErrorHandler(type, handler),
  getStats: () => errorHandler.getErrorStats(),
  clearHistory: () => errorHandler.clearHistory(),
  hasRecentCritical: (timeWindow) => errorHandler.hasRecentCriticalErrors(timeWindow)
};

export default errors;