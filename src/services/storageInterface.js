/**
 * storageInterface.js
 * -------------------
 * Abstract storage interface for recording services.
 * Enables easy switching between localStorage, remote storage, etc.
 */

/**
 * Abstract base class for storage services
 * All storage implementations should extend this class
 */
export class StorageService {
  /**
   * Upload a recording with progress tracking
   * @param {Blob} recordingBlob - The audio/video blob to upload
   * @param {string} fileName - The filename for the recording
   * @param {string} captureMode - 'audio' or 'video'
   * @param {Function} onProgress - Progress callback (0-1)
   * @param {string} mimeType - The MIME type of the recording
   * @returns {Promise<{docId: string, downloadURL: string}>}
   */
  async uploadRecording(recordingBlob, fileName, captureMode, onProgress, mimeType) {
    throw new Error('uploadRecording method must be implemented by subclass');
  }

  /**
   * Fetch a specific recording by ID
   * @param {string} docId - The recording document ID
   * @returns {Promise<{metadata: Object, blobUrl: string}>}
   */
  async fetchRecording(docId) {
    throw new Error('fetchRecording method must be implemented by subclass');
  }

  /**
   * Fetch all recordings with optional filtering
   * @param {Object} filters - Optional filters (date, type, etc.)
   * @returns {Promise<Array>} Array of recording metadata
   */
  async fetchAllRecordings(filters = {}) {
    throw new Error('fetchAllRecordings method must be implemented by subclass');
  }

  /**
   * Delete all recordings (admin function)
   * @returns {Promise<void>}
   */
  async clearAllRecordings() {
    throw new Error('clearAllRecordings method must be implemented by subclass');
  }

  /**
   * Get storage usage statistics
   * @returns {Promise<{used: number, available: number, total: number}>}
   */
  async getStorageStats() {
    throw new Error('getStorageStats method must be implemented by subclass');
  }
}

/**
 * Local storage implementation of the storage service
 * Preserves all existing behavior
 */
export class LocalStorageService extends StorageService {
  constructor() {
    super();
    // Import the actual implementation functions
    this._localService = null;
    this._initializeService();
  }

  async _initializeService() {
    // Dynamically import to avoid circular dependencies
    const service = await import('./localRecordingService');
    this._localService = service;
  }

  async uploadRecording(recordingBlob, fileName, captureMode, onProgress, mimeType) {
    if (!this._localService) await this._initializeService();
    return this._localService.uploadRecording(recordingBlob, fileName, captureMode, onProgress, mimeType);
  }

  async fetchRecording(docId) {
    if (!this._localService) await this._initializeService();
    return this._localService.fetchRecording(docId);
  }

  async fetchAllRecordings(filters = {}) {
    if (!this._localService) await this._initializeService();
    return this._localService.fetchAllRecordings();
  }

  async clearAllRecordings() {
    if (!this._localService) await this._initializeService();
    return this._localService.clearAllLocalRecordings();
  }

  async getStorageStats() {
    if (!this._localService) await this._initializeService();
    return this._localService.getLocalStorageStats();
  }
}

/**
 * Factory function to create the appropriate storage service
 * Based on environment configuration
 */
export function createStorageService() {
  // For now, always return LocalStorageService
  // In the future, this can check ENV_CONFIG.STORAGE_TYPE
  return new LocalStorageService();
}

/**
 * Default storage service instance
 * Apps can use this directly or create their own via the factory
 */
export const defaultStorageService = createStorageService();