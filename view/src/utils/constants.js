// Application Constants

// Recording Configuration
export const RECORDING_CONFIG = {
  MAX_TIME_SECONDS: 900, // 15 minutes
  MAX_FILE_SIZE_MB: 50,
  SUPPORTED_VIDEO_TYPES: ['video/webm', 'video/mp4'],
  SUPPORTED_AUDIO_TYPES: ['audio/webm', 'audio/wav'],
  
  // Video settings
  VIDEO_CONSTRAINTS: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
    facingMode: 'user'
  },
  
  // Audio settings
  AUDIO_CONSTRAINTS: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 44100
  }
};

// UI Constants
export const UI_CONFIG = {
  COLORS: {
    PRIMARY: '#2c2f48',
    SECONDARY: '#666',
    BACKGROUND: '#f5f4f0',
    CARD_BACKGROUND: '#fff',
    TERTIARY: '#e4e2d8',
    ERROR: '#d32f2f',
    SUCCESS: '#388e3c',
    WARNING: '#f57c00'
  },
  
  BREAKPOINTS: {
    MOBILE: 480,
    TABLET: 768,
    DESKTOP: 1024
  },
  
  ANIMATIONS: {
    DURATION_SHORT: '0.2s',
    DURATION_MEDIUM: '0.3s',
    DURATION_LONG: '0.5s',
    EASING: 'ease-in-out'
  }
};

// App States
export const APP_STATES = {
  LOADING: 'loading',
  SESSION_ERROR: 'session_error',
  MODE_SELECTION: 'mode_selection',
  RECORDING_READY: 'recording_ready',
  COUNTDOWN: 'countdown',
  RECORDING: 'recording',
  PAUSED: 'paused',
  REVIEW: 'review',
  UPLOADING: 'uploading',
  SUCCESS: 'success'
};

// Error Types
export const ERROR_TYPES = {
  PERMISSION_DENIED: 'permission_denied',
  NO_DEVICE: 'no_device',
  NOT_SUPPORTED: 'not_supported',
  OVERCONSTRAINED: 'overconstrained',
  NETWORK_ERROR: 'network_error',
  UPLOAD_ERROR: 'upload_error',
  SESSION_EXPIRED: 'expired',
  SESSION_COMPLETED: 'completed',
  SESSION_REMOVED: 'removed',
  INVALID_URL: 'invalid_url'
};

// Analytics Events
export const ANALYTICS_EVENTS = {
  SESSION_START: 'session_start',
  MODE_SELECTED: 'mode_selected',
  PERMISSIONS_GRANTED: 'permissions_granted',
  PERMISSION_DENIED: 'permission_denied',
  RECORDING_STARTED: 'recording_started',
  RECORDING_PAUSED: 'recording_paused',
  RECORDING_RESUMED: 'recording_resumed',
  RECORDING_COMPLETED: 'recording_completed',
  RECORDING_RESTARTED: 'recording_restarted',
  UPLOAD_STARTED: 'upload_started',
  UPLOAD_PROGRESS: 'upload_progress',
  UPLOAD_COMPLETED: 'upload_completed',
  UPLOAD_FAILED: 'upload_failed',
  ERROR_OCCURRED: 'error_occurred'
};

// Browser Support
export const BROWSER_SUPPORT = {
  REQUIRED_FEATURES: [
    'mediaRecorder',
    'getUserMedia',
    'webRTC',
    'websockets'
  ],
  
  SUPPORTED_BROWSERS: {
    CHROME: { name: 'Chrome', minVersion: 80 },
    FIREFOX: { name: 'Firefox', minVersion: 75 },
    SAFARI: { name: 'Safari', minVersion: 14 },
    EDGE: { name: 'Edge', minVersion: 80 }
  }
};

// File Upload
export const UPLOAD_CONFIG = {
  CHUNK_SIZE: 1024 * 1024, // 1MB chunks
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  TIMEOUT_MS: 30000 // 30 seconds
};

// Session Management
export const SESSION_CONFIG = {
  EXPIRY_DAYS: 30,
  CLEANUP_INTERVAL_HOURS: 24,
  VALID_STATUSES: ['active', 'completed', 'expired', 'removed']
};

// Validation Rules
export const VALIDATION = {
  MIN_RECORDING_DURATION: 1, // 1 second
  MAX_RECORDING_DURATION: 900, // 15 minutes
  MIN_FILE_SIZE: 1024, // 1KB
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  
  QUESTION_MAX_LENGTH: 500,
  ASKER_MAX_LENGTH: 100
};

// Default Messages
export const MESSAGES = {
  LOADING: 'Loading...',
  INITIALIZING: 'Initializing...',
  CONNECTING: 'Connecting...',
  UPLOADING: 'Uploading...',
  PROCESSING: 'Processing...',
  SUCCESS: 'Success!',
  
  ERRORS: {
    GENERAL: 'An unexpected error occurred. Please try again.',
    NETWORK: 'Network error. Please check your connection.',
    PERMISSIONS: 'Permission denied. Please allow access to continue.',
    BROWSER: 'Your browser is not supported. Please use a modern browser.',
    SESSION: 'Unable to load recording session.',
    UPLOAD: 'Upload failed. Please try again.',
    RECORDING: 'Recording failed. Please try again.'
  }
};

// Development
export const DEV_CONFIG = {
  DEBUG_ENABLED: process.env.NODE_ENV === 'development',
  VERBOSE_LOGGING: process.env.REACT_APP_DEBUG === 'true',
  ANALYTICS_ENABLED: process.env.REACT_APP_ANALYTICS_ENABLED === 'true'
};