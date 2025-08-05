import React, { useState, useEffect } from 'react';
import { signInAnonymousUser, CONFIG } from '../services/firebase';

const DebugInfo = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [authTest, setAuthTest] = useState('pending');

  useEffect(() => {
    const runDebugChecks = async () => {
      // Check environment variables
      const envCheck = {
        apiKey: !!process.env.REACT_APP_FIREBASE_API_KEY,
        authDomain: !!process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        projectId: !!process.env.REACT_APP_FIREBASE_PROJECT_ID,
        storageBucket: !!process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: !!process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
        appId: !!process.env.REACT_APP_FIREBASE_APP_ID
      };

      // Check browser features
      const browserCheck = {
        mediaRecorder: typeof MediaRecorder !== 'undefined',
        getUserMedia: typeof navigator.mediaDevices?.getUserMedia === 'function',
        webRTC: typeof RTCPeerConnection !== 'undefined',
        websockets: typeof WebSocket !== 'undefined'
      };

      setDebugInfo({
        environment: envCheck,
        browser: browserCheck,
        config: CONFIG
      });

      // Test Firebase authentication
      try {
        await signInAnonymousUser();
        setAuthTest('success');
      } catch (error) {
        setAuthTest(`failed: ${error.message}`);
      }
    };

    runDebugChecks();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '12px' }}>
      <h2>Debug Information</h2>
      
      <h3>Environment Variables</h3>
      <pre>{JSON.stringify(debugInfo.environment, null, 2)}</pre>
      
      <h3>Browser Support</h3>
      <pre>{JSON.stringify(debugInfo.browser, null, 2)}</pre>
      
      <h3>Configuration</h3>
      <pre>{JSON.stringify(debugInfo.config, null, 2)}</pre>
      
      <h3>Firebase Authentication Test</h3>
      <p>Status: <strong>{authTest}</strong></p>
      
      <h3>Current URL</h3>
      <p>{window.location.href}</p>
    </div>
  );
};

export default DebugInfo;