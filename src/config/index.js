/**
 * config/index.js
 * ---------------
 * Centralized configuration for the Recording App.
 * Replaces scattered magic numbers with named constants while preserving exact values.
 */

// Recording limits and timing
export const RECORDING_LIMITS = {
  // 30-second recording limit (was hardcoded in 8+ places)
  MAX_DURATION_SECONDS: 30,
  
  // Countdown sequence for recording start/resume
  COUNTDOWN_STEPS: [3, 2, 1, 'BEGIN'],
  
  // Recording timer interval (milliseconds)
  TIMER_INTERVAL_MS: 1000
};

// Supported media formats (preserves existing format priority)
export const SUPPORTED_FORMATS = {
  video: [
    'video/mp4;codecs=h264',
    'video/webm;codecs=vp8,opus'
  ],
  audio: [
    'audio/mp4;codecs=aac', 
    'audio/webm;codecs=opus'
  ]
};

// File extensions mapped to MIME types
export const FILE_EXTENSIONS = {
  video: {
    'mp4': 'mp4',
    'webm': 'webm',
    default: 'webm'
  },
  audio: {
    'mp4': 'm4a', // AAC-based recordings use .m4a
    'webm': 'webm', 
    default: 'webm'
  }
};

// UI timing and animation constants
export const UI_CONSTANTS = {
  // Layout spacing (commonly used values)
  MARGINS: {
    TOP_SMALL: 10,
    TOP_MEDIUM: 30,
    BOTTOM_MEDIUM: 40
  },
  
  // Recording bar positioning
  RECORDING_BAR: {
    TOP_OFFSET: 15,
    MAX_WIDTH: 480,
    PADDING: '0 16px'
  }
};

// Service configuration
export const SERVICE_CONFIG = {
  // Local storage service settings
  LOCAL_STORAGE: {
    RECORDINGS_KEY: 'local_recordings',
    BLOB_STORAGE_KEY: 'local_blobs',
    UPLOAD_PROGRESS_INTERVAL_MS: 200,
    FETCH_DELAY_MS: 300 // Simulated network delay
  }
};