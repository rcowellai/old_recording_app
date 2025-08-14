// ----------------------------------------------------------
// localRecordingService.js - LOCAL STORAGE IMPLEMENTATION
// ----------------------------------------------------------
//
// This file provides local storage implementations for recording
// services. Recordings are stored in browser localStorage with
// blob URLs for playback. No server or network connection needed.
//
// ----------------------------------------------------------

// Local storage keys
const RECORDINGS_KEY = 'local_recordings';
const BLOB_STORAGE_KEY = 'local_blobs';

// Simulate server timestamp
const serverTimestamp = () => new Date().toISOString();

// Helper to get recordings from localStorage
function getStoredRecordings() {
  try {
    const stored = localStorage.getItem(RECORDINGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Helper to save recordings to localStorage
function saveRecordings(recordings) {
  try {
    localStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));
  } catch (err) {
    console.warn('Failed to save recordings to localStorage:', err);
  }
}

// Helper to store blob URL
function storeBlobUrl(docId, blobUrl) {
  try {
    const stored = localStorage.getItem(BLOB_STORAGE_KEY) || '{}';
    const blobs = JSON.parse(stored);
    blobs[docId] = blobUrl;
    localStorage.setItem(BLOB_STORAGE_KEY, JSON.stringify(blobs));
  } catch (err) {
    console.warn('Failed to store blob URL:', err);
  }
}

// Helper to get blob URL
function getBlobUrl(docId) {
  try {
    const stored = localStorage.getItem(BLOB_STORAGE_KEY) || '{}';
    const blobs = JSON.parse(stored);
    return blobs[docId] || null;
  } catch {
    return null;
  }
}

/**
 * Fetch a single recording document by ID (LOCAL VERSION).
 * @param {string} docId Local recording ID
 * @returns {Promise<Object|null>} The recording data or null if not found
 */
export async function fetchRecording(docId) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  try {
    const recordings = getStoredRecordings();
    const recording = recordings.find(r => r.id === docId);
    
    if (!recording) {
      return null;
    }
    
    // Get the stored blob URL
    const downloadURL = getBlobUrl(docId);
    
    return {
      ...recording,
      downloadURL: downloadURL || recording.downloadURL
    };
  } catch (err) {
    console.error('Error in fetchRecording:', err);
    throw err;
  }
}

/**
 * Fetch all recordings (LOCAL VERSION).
 * @returns {Promise<Array>} Array of recording objects
 */
export async function fetchAllRecordings() {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    const recordings = getStoredRecordings();
    console.log('📦 Local recordings found:', recordings.length);
    return recordings;
  } catch (err) {
    console.error('Error in fetchAllRecordings:', err);
    throw err;
  }
}

/**
 * Upload a blob (LOCAL VERSION - stores in browser).
 * Simulates upload process with progress callbacks for smooth UX.
 *
 * @param {Blob} blob        The recording blob
 * @param {string} fileName  The desired file name
 * @param {string} fileType  'audio' or 'video'
 * @param {function} onProgress A callback for upload progress (fraction)
 * @param {string} [actualMimeType] Optional actual mime type
 * @returns {Promise<{ docId: string, downloadURL: string }>}
 */
export async function uploadRecording(
  blob,
  fileName,
  fileType,
  onProgress,
  actualMimeType
) {
  return new Promise((resolve) => {
    try {
      console.log('🚀 Local upload started:', fileName, fileType);
      
      // Create blob URL for local playback
      const downloadURL = URL.createObjectURL(blob);
      
      // Generate unique doc ID
      const docId = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      // Simulate upload progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 0.3;
        if (progress > 1) progress = 1;
        
        if (onProgress) {
          onProgress(progress);
        }
        
        if (progress >= 1) {
          clearInterval(progressInterval);
          
          // Store the recording metadata
          const recordings = getStoredRecordings();
          const newRecording = {
            id: docId,
            downloadURL,
            fileType,
            fileName,
            createdAt: serverTimestamp(),
            // Add some demo metadata
            size: blob.size,
            mimeType: actualMimeType || blob.type
          };
          
          recordings.push(newRecording);
          saveRecordings(recordings);
          
          // Store blob URL separately for retrieval
          storeBlobUrl(docId, downloadURL);
          
          console.log('✅ Local upload complete:', { docId, fileName });
          resolve({ docId, downloadURL });
        }
      }, 200); // Update progress every 200ms
      
    } catch (err) {
      console.error('Error in local uploadRecording:', err);
      resolve({ 
        docId: 'error_' + Date.now(), 
        downloadURL: URL.createObjectURL(blob) 
      });
    }
  });
}

// Helper function to clear all local recordings (useful for testing)
export function clearAllLocalRecordings() {
  localStorage.removeItem(RECORDINGS_KEY);
  localStorage.removeItem(BLOB_STORAGE_KEY);
  console.log('🗑️ All local recordings cleared');
}

// Helper function to get storage stats
export function getLocalStorageStats() {
  const recordings = getStoredRecordings();
  const totalSize = recordings.reduce((sum, r) => sum + (r.size || 0), 0);
  
  return {
    count: recordings.length,
    totalSize,
    recordings
  };
}

console.log('📱 Local Recording Service: ENABLED');
console.log('💾 Recordings will be stored in browser localStorage');