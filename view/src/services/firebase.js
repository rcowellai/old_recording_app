// Firebase Configuration and Initialization
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Debug Firebase configuration
if (process.env.REACT_APP_DEBUG === 'true') {
  console.log('Firebase Config:', {
    apiKey: firebaseConfig.apiKey ? '***configured***' : 'missing',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId ? '***configured***' : 'missing',
    appId: firebaseConfig.appId ? '***configured***' : 'missing'
  });
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Configuration constants
export const CONFIG = {
  MAX_RECORDING_TIME: parseInt(process.env.REACT_APP_MAX_RECORDING_TIME) || 900, // 15 minutes
  SESSION_EXPIRY_DAYS: parseInt(process.env.REACT_APP_SESSION_EXPIRY_DAYS) || 30,
  ANALYTICS_ENABLED: process.env.REACT_APP_ANALYTICS_ENABLED === 'true',
  DEBUG: process.env.REACT_APP_DEBUG === 'true'
};

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Initialize Analytics conditionally
let analytics = null;
try {
  if (CONFIG.ANALYTICS_ENABLED && typeof window !== 'undefined') {
    analytics = getAnalytics(app);
    if (CONFIG.DEBUG) {
      console.log('Firebase Analytics initialized');
    }
  }
} catch (error) {
  console.warn('Firebase Analytics initialization failed:', error.message);
}
export { analytics };

// Authentication helper
export const signInAnonymousUser = async () => {
  try {
    if (CONFIG.DEBUG) {
      console.log('Attempting anonymous authentication...');
    }
    const userCredential = await signInAnonymously(auth);
    if (CONFIG.DEBUG) {
      console.log('Anonymous user signed in:', userCredential.user.uid);
    }
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in anonymously:', error);
    if (CONFIG.DEBUG) {
      console.error('Authentication error details:', {
        code: error.code,
        message: error.message,
        name: error.name
      });
    }
    throw new Error(`Authentication failed: ${error.message}`);
  }
};

// Session Management
export const getRecordingSession = async (sessionId) => {
  try {
    const sessionDoc = await getDoc(doc(db, 'recordingSessions', sessionId));
    
    if (!sessionDoc.exists()) {
      return { 
        status: 'removed', 
        message: 'This question has been removed by the account owner' 
      };
    }
    
    const session = sessionDoc.data();
    
    // Check if expired
    const now = new Date();
    const expiresAt = session.expiresAt?.toDate();
    if (expiresAt && now > expiresAt) {
      return { 
        status: 'expired', 
        message: 'This recording link has expired' 
      };
    }
    
    // Check if already completed
    if (session.status === 'completed') {
      return { 
        status: 'completed', 
        message: 'This memory has been recorded' 
      };
    }
    
    return {
      status: 'active',
      question: session.question,
      sessionId: sessionId,
      promptId: session.promptId,
      asker: session.asker || 'Someone'
    };
    
  } catch (error) {
    console.error('Error fetching recording session:', error);
    return { 
      status: 'error', 
      message: 'Failed to load recording session' 
    };
  }
};

// File Upload with Progress
export const uploadRecording = (sessionId, blob, type, onProgress) => {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const extension = type === 'video' ? 'webm' : 'wav';
    const filename = `${sessionId}_${timestamp}.${extension}`;
    
    const storageRef = ref(storage, `recordings/${sessionId}/${filename}`);
    
    const metadata = {
      contentType: blob.type,
      customMetadata: {
        sessionId: sessionId,
        recordingType: type,
        timestamp: timestamp.toString()
      }
    };
    
    const uploadTask = uploadBytesResumable(storageRef, blob, metadata);
    
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(progress);
        }
        if (CONFIG.DEBUG) {
          console.log('Upload progress:', progress + '%');
        }
      },
      (error) => {
        console.error('Upload error:', error);
        reject(new Error('Upload failed: ' + error.message));
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Update session with recording URL
          await updateDoc(doc(db, 'recordingSessions', sessionId), {
            status: 'completed',
            recordingUrl: downloadURL,
            recordingType: type,
            completedAt: serverTimestamp(),
            fileSize: blob.size,
            duration: 0 // Will be calculated by Cloud Function
          });
          
          resolve({
            success: true,
            downloadURL,
            filename
          });
        } catch (error) {
          console.error('Error updating session:', error);
          reject(new Error('Failed to update session'));
        }
      }
    );
  });
};

// Analytics Helper
export const recordAnalyticsEvent = async (sessionId, eventType, eventData = {}) => {
  if (!CONFIG.ANALYTICS_ENABLED) return;
  
  try {
    const analyticsData = {
      sessionId,
      eventType,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      deviceType: getDeviceType(),
      ...eventData
    };
    
    await addDoc(collection(db, 'analytics'), analyticsData);
    
    if (CONFIG.DEBUG) {
      console.log('Analytics event recorded:', eventType, eventData);
    }
  } catch (error) {
    console.error('Error recording analytics:', error);
    // Don't throw - analytics failures shouldn't break the app
  }
};

// Device Detection Helper
const getDeviceType = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/tablet|ipad|playbook|silk|(android(?!.*mobile))/.test(userAgent)) {
    return 'tablet';
  }
  
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/.test(userAgent)) {
    return 'mobile';
  }
  
  return 'desktop';
};

// Error Logging Helper
export const logError = async (sessionId, error, context = '') => {
  try {
    await addDoc(collection(db, 'errorLogs'), {
      sessionId,
      error: error.message || error,
      stack: error.stack || '',
      context,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }
};

// Browser Compatibility Check
export const checkBrowserSupport = () => {
  const features = {
    mediaRecorder: typeof MediaRecorder !== 'undefined',
    getUserMedia: typeof navigator.mediaDevices?.getUserMedia === 'function',
    webRTC: typeof RTCPeerConnection !== 'undefined',
    websockets: typeof WebSocket !== 'undefined'
  };
  
  const isSupported = Object.values(features).every(Boolean);
  
  if (CONFIG.DEBUG) {
    console.log('Browser support check:', features);
  }
  
  return {
    isSupported,
    features,
    missingFeatures: Object.keys(features).filter(key => !features[key])
  };
};

export default app;