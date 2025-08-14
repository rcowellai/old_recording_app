/**
 * constants/recording.js
 * ----------------------
 * Additional recording constants to complement src/config/index.js
 * Centralizes magic numbers found throughout the codebase
 */

// Canvas dimensions for AudioRecorder component
export const CANVAS = {
  WIDTH: 80,
  HEIGHT: 80,
  CENTER_Y: 40,
  OFFSET_X: 16,
  WAVE_WIDTH: 48,
  WAVE_HEIGHT: 48,
  SENSITIVITY_FACTOR: 1.3
};

// Color constants used throughout the app
export const COLORS = {
  BACKGROUND_SECONDARY: '#E4E2D8',
  RECORDING_RED: '#B3261E',
  INACTIVE_GRAY: '#999999',
  PRIMARY_DARK: '#2C2F48',
  PRIMARY_LIGHT: '#F5F4F0',
  TEXT_GRAY: '#666'
};

// Layout constants for UI positioning and sizing
export const LAYOUT = {
  MAX_WIDTH: '480px',
  RECORDING_BAR_PADDING: '0 16px',
  Z_INDEX_RECORDING_BAR: 999,
  RECORDING_BAR_TOP_OFFSET: '15px',
  MARGIN_TOP_SMALL: '10px',
  MARGIN_TOP_MEDIUM: '30px',
  MARGIN_BOTTOM_MEDIUM: '40px',
  MARGIN_BOTTOM_SMALL: '10px',
  QR_CODE_SIZE: 80,
  RECORD_ICON_SIZE: 16
};

// Time formatting constants
export const TIME_FORMAT = {
  SECONDS_PER_MINUTE: 60,
  ZERO_PADDING_THRESHOLD: 10,
  DEFAULT_TIME_DISPLAY: '0:00'
};

// Audio analysis constants
export const AUDIO_ANALYSIS = {
  FFT_SIZE: 256,
  DATA_TYPE: Uint8Array,
  NORMALIZATION_FACTOR: 128.0,
  CENTERING_OFFSET: 1.0
};

// Video player constants
export const VIDEO_PLAYER = {
  IOS_TIME_FIX: 0.001,
  SLIDER_STEP: 0.1,
  SLIDER_MIN: 0
};