import {
  formatTime,
  formatDuration,
  formatFileSize,
  validateRecordingDuration,
  validateFileSize,
  getDeviceType,
  getBrowserInfo,
  checkMediaRecorderSupport,
  getErrorMessage,
  isValidSessionId,
  retryWithDelay
} from '../helpers';

// Mock constants
jest.mock('../constants', () => ({
  VALIDATION: {
    MIN_RECORDING_DURATION: 1,
    MAX_RECORDING_DURATION: 900,
    MIN_FILE_SIZE: 1024,
    MAX_FILE_SIZE: 50 * 1024 * 1024
  },
  RECORDING_CONFIG: {
    SUPPORTED_VIDEO_TYPES: ['video/webm', 'video/mp4'],
    SUPPORTED_AUDIO_TYPES: ['audio/webm', 'audio/wav']
  }
}));

describe('Time formatting', () => {
  test('formatTime formats seconds correctly', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(30)).toBe('0:30');
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(125)).toBe('2:05');
  });

  test('formatDuration formats duration correctly', () => {
    expect(formatDuration(30)).toBe('30s');
    expect(formatDuration(60)).toBe('1m');
    expect(formatDuration(90)).toBe('1m 30s');
    expect(formatDuration(120)).toBe('2m');
  });
});

describe('File size formatting', () => {
  test('formatFileSize formats bytes correctly', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(1048576)).toBe('1 MB');
  });
});

describe('Validation functions', () => {
  test('validateRecordingDuration validates duration correctly', () => {
    expect(validateRecordingDuration(0.5)).toBe(false);
    expect(validateRecordingDuration(1)).toBe(true);
    expect(validateRecordingDuration(450)).toBe(true);
    expect(validateRecordingDuration(900)).toBe(true);
    expect(validateRecordingDuration(901)).toBe(false);
  });

  test('validateFileSize validates file size correctly', () => {
    expect(validateFileSize(512)).toBe(false);
    expect(validateFileSize(1024)).toBe(true);
    expect(validateFileSize(1024 * 1024)).toBe(true);
    expect(validateFileSize(50 * 1024 * 1024)).toBe(true);
    expect(validateFileSize(51 * 1024 * 1024)).toBe(false);
  });
});

describe('Device detection', () => {
  const originalUserAgent = navigator.userAgent;

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true
    });
  });

  test('getDeviceType detects mobile devices', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)',
      configurable: true
    });
    expect(getDeviceType()).toBe('mobile');
  });

  test('getDeviceType detects desktop devices', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      configurable: true
    });
    expect(getDeviceType()).toBe('desktop');
  });
});

describe('Browser detection', () => {
  const originalUserAgent = navigator.userAgent;

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true
    });
  });

  test('getBrowserInfo detects Chrome', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      configurable: true
    });
    const { browser, version } = getBrowserInfo();
    expect(browser).toBe('Chrome');
    expect(version).toBe('91');
  });

  test('getBrowserInfo detects Firefox', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      configurable: true
    });
    const { browser, version } = getBrowserInfo();
    expect(browser).toBe('Firefox');
    expect(version).toBe('89');
  });
});

describe('Media support detection', () => {
  test('checkMediaRecorderSupport returns true when supported', () => {
    global.MediaRecorder = jest.fn();
    global.navigator.mediaDevices = {
      getUserMedia: jest.fn()
    };
    expect(checkMediaRecorderSupport()).toBe(true);
  });

  test('checkMediaRecorderSupport returns false when not supported', () => {
    global.MediaRecorder = undefined;
    expect(checkMediaRecorderSupport()).toBe(false);
  });
});

describe('Error handling', () => {
  test('getErrorMessage handles string errors', () => {
    expect(getErrorMessage('Test error')).toBe('Test error');
  });

  test('getErrorMessage handles error objects', () => {
    const error = new Error('Test error message');
    expect(getErrorMessage(error)).toBe('Test error message');
  });

  test('getErrorMessage handles NotAllowedError', () => {
    const error = { name: 'NotAllowedError' };
    expect(getErrorMessage(error)).toBe('Permission denied. Please allow access to your camera and microphone.');
  });
});

describe('Session ID validation', () => {
  test('isValidSessionId validates session IDs correctly', () => {
    expect(isValidSessionId('')).toBe(false);
    expect(isValidSessionId('short')).toBe(false);
    expect(isValidSessionId('valid-session-123')).toBe(true);
    expect(isValidSessionId('invalid session id')).toBe(false);
    expect(isValidSessionId('valid_session_123')).toBe(true);
  });
});

describe('Retry utility', () => {
  test('retryWithDelay succeeds on first try', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const result = await retryWithDelay(mockFn, 3, 100);
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('retryWithDelay retries on failure', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');
    
    const result = await retryWithDelay(mockFn, 3, 10);
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  test('retryWithDelay throws after max retries', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('always fails'));
    
    await expect(retryWithDelay(mockFn, 2, 10)).rejects.toThrow('always fails');
    expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });
});