// Utility Helper Functions

import { RECORDING_CONFIG, VALIDATION } from './constants';

// Time formatting functions
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatDuration = (seconds) => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const mins = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;
  
  if (remainingSecs === 0) {
    return `${mins}m`;
  }
  
  return `${mins}m ${remainingSecs}s`;
};

// File size formatting
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Validation functions
export const validateRecordingDuration = (duration) => {
  return duration >= VALIDATION.MIN_RECORDING_DURATION && 
         duration <= VALIDATION.MAX_RECORDING_DURATION;
};

export const validateFileSize = (size) => {
  return size >= VALIDATION.MIN_FILE_SIZE && 
         size <= VALIDATION.MAX_FILE_SIZE;
};

export const validateQuestion = (question) => {
  return question && 
         question.trim().length > 0 && 
         question.length <= VALIDATION.QUESTION_MAX_LENGTH;
};

export const validateAsker = (asker) => {
  return asker && 
         asker.trim().length > 0 && 
         asker.length <= VALIDATION.ASKER_MAX_LENGTH;
};

// Device detection
export const getDeviceType = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/tablet|ipad|playbook|silk|(android(?!.*mobile))/.test(userAgent)) {
    return 'tablet';
  }
  
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/.test(userAgent)) {
    return 'mobile';
  }
  
  return 'desktop';
};

export const isMobile = () => {
  return getDeviceType() === 'mobile';
};

export const isTablet = () => {
  return getDeviceType() === 'tablet';
};

export const isDesktop = () => {
  return getDeviceType() === 'desktop';
};

// Browser detection and feature support
export const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  let browser = 'Unknown';
  let version = 'Unknown';
  
  if (userAgent.includes('Chrome')) {
    browser = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
    const match = userAgent.match(/Version\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  } else if (userAgent.includes('Edge')) {
    browser = 'Edge';
    const match = userAgent.match(/Edge\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  }
  
  return { browser, version };
};

export const checkMediaRecorderSupport = () => {
  return typeof MediaRecorder !== 'undefined' && 
         typeof navigator.mediaDevices?.getUserMedia === 'function';
};

export const getSupportedMimeTypes = () => {
  const types = [];
  
  // Check video types
  RECORDING_CONFIG.SUPPORTED_VIDEO_TYPES.forEach(type => {
    if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) {
      types.push(type);
    }
  });
  
  // Check audio types
  RECORDING_CONFIG.SUPPORTED_AUDIO_TYPES.forEach(type => {
    if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) {
      types.push(type);
    }
  });
  
  return types;
};

// Error handling
export const getErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  // MediaRecorder specific errors
  if (error?.name) {
    switch (error.name) {
      case 'NotAllowedError':
        return 'Permission denied. Please allow access to your camera and microphone.';
      case 'NotFoundError':
        return 'No camera or microphone found. Please check your device.';
      case 'NotSupportedError':
        return 'Your browser does not support media recording.';
      case 'OverconstrainedError':
        return 'Camera settings not supported by your device.';
      case 'SecurityError':
        return 'Security error. Please ensure you\'re using HTTPS.';
      case 'TypeError':
        return 'Invalid recording configuration.';
      default:
        return error.name;
    }
  }
  
  return 'An unexpected error occurred.';
};

// URL utilities
export const getSessionIdFromUrl = () => {
  const path = window.location.pathname;
  const match = path.match(/\/record\/(.+)$/);
  return match ? match[1] : null;
};

export const isValidSessionId = (sessionId) => {
  return sessionId && 
         typeof sessionId === 'string' && 
         sessionId.length > 10 && // Reasonable minimum length
         /^[a-zA-Z0-9_-]+$/.test(sessionId); // Alphanumeric with dashes/underscores
};

// Analytics utilities
export const generateEventId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const getSessionDuration = (startTime) => {
  return Math.floor((Date.now() - startTime) / 1000);
};

// Retry utilities
export const retryWithDelay = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithDelay(fn, retries - 1, delay * 1.5); // Exponential backoff
    }
    throw error;
  }
};

// Local storage utilities
export const setLocalStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn('Failed to set localStorage item:', error);
    return false;
  }
};

export const getLocalStorageItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn('Failed to get localStorage item:', error);
    return defaultValue;
  }
};

export const removeLocalStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn('Failed to remove localStorage item:', error);
    return false;
  }
};

// Debounce utility
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle utility
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Performance utilities
export const measurePerformance = (name, fn) => {
  return async (...args) => {
    const start = performance.now();
    const result = await fn(...args);
    const end = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${name} took ${end - start} milliseconds`);
    }
    
    return result;
  };
};

// Color utilities
export const hexToRgba = (hex, alpha = 1) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getContrastColor = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '#000000';
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#ffffff';
};