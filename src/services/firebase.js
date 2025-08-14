// ----------------------------------------------------------
// firebase.js - LOCAL MOCK VERSION  
// ----------------------------------------------------------
//
// This file provides mock Firebase initialization for local development.
// No actual Firebase connection is made.
//
// ----------------------------------------------------------

console.log('🔥 Firebase Service: LOCAL MOCK MODE ENABLED');
console.log('🚫 No actual Firebase connection will be made');

// Mock Firebase app object
const mockApp = {
  name: 'mock-app',
  options: {
    projectId: 'local-demo'
  }
};

// Mock Firestore
export const db = {
  type: 'mock-firestore',
  projectId: 'local-demo'
};

// Mock Storage  
export const storage = {
  type: 'mock-storage',
  bucket: 'local-demo'
};

// Export mock app as default
export default mockApp;