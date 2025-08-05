// Jest DOM matchers
import '@testing-library/jest-dom';

// Mock environment variables
process.env.REACT_APP_FIREBASE_API_KEY = 'test-api-key';
process.env.REACT_APP_FIREBASE_AUTH_DOMAIN = 'test-domain.firebaseapp.com';
process.env.REACT_APP_FIREBASE_PROJECT_ID = 'test-project';
process.env.REACT_APP_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com';
process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID = '123456789';
process.env.REACT_APP_FIREBASE_APP_ID = 'test-app-id';

// Mock Firebase
jest.mock('./services/firebase', () => ({
  auth: {},
  db: {},
  storage: {},
  functions: {},
  getRecordingSession: jest.fn(),
  uploadRecording: jest.fn(),
  recordAnalyticsEvent: jest.fn(),
  logError: jest.fn()
}));

// Mock MediaRecorder
global.MediaRecorder = class MockMediaRecorder {
  constructor(stream, options) {
    this.stream = stream;
    this.options = options;
    this.state = 'inactive';
    this.ondataavailable = null;
    this.onstop = null;
    this.onstart = null;
    this.onerror = null;
  }

  start(timeslice) {
    this.state = 'recording';
    if (this.onstart) this.onstart();
    
    // Simulate data chunks
    setTimeout(() => {
      if (this.ondataavailable) {
        this.ondataavailable({
          data: new Blob(['mock-audio-data'], { type: 'audio/webm' })
        });
      }
    }, 100);
  }

  stop() {
    this.state = 'inactive';
    if (this.onstop) this.onstop();
  }

  pause() {
    this.state = 'paused';
  }

  resume() {
    this.state = 'recording';
  }

  static isTypeSupported(mimeType) {
    return ['audio/webm', 'video/webm', 'audio/wav'].includes(mimeType);
  }
};

// Mock getUserMedia
global.navigator.mediaDevices = {
  getUserMedia: jest.fn(() => 
    Promise.resolve({
      getTracks: () => [
        {
          stop: jest.fn(),
          getSettings: () => ({ width: 1280, height: 720 })
        }
      ],
      getVideoTracks: () => [
        {
          stop: jest.fn(),
          getSettings: () => ({ width: 1280, height: 720 })
        }
      ],
      getAudioTracks: () => [
        {
          stop: jest.fn(),
          getSettings: () => ({ sampleRate: 44100 })
        }
      ]
    })
  ),
  enumerateDevices: jest.fn(() => 
    Promise.resolve([
      { kind: 'videoinput', deviceId: 'camera1', label: 'Default Camera' },
      { kind: 'audioinput', deviceId: 'mic1', label: 'Default Microphone' }
    ])
  )
};

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = jest.fn();

// Mock performance API
global.performance.memory = {
  usedJSHeapSize: 1000000,
  totalJSHeapSize: 2000000,
  jsHeapSizeLimit: 4000000
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock PerformanceObserver
global.PerformanceObserver = class PerformanceObserver {
  constructor() {}
  observe() {}
  disconnect() {}
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock window.location
delete window.location;
window.location = {
  href: 'http://localhost:3000/record/test-session-id',
  pathname: '/record/test-session-id',
  search: '',
  hash: ''
};

// Suppress console warnings in tests
const originalWarn = console.warn;
beforeEach(() => {
  console.warn = jest.fn();
});

afterEach(() => {
  console.warn = originalWarn;
});