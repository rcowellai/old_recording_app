import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Components
import RecordingApp from './components/RecordingApp';
import ErrorBoundary from './components/ErrorBoundary';
import DebugInfo from './components/DebugInfo';

// Services
import { signInAnonymousUser, checkBrowserSupport, CONFIG } from './services/firebase';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [browserSupport, setBrowserSupport] = useState(null); // eslint-disable-line no-unused-vars
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (CONFIG.DEBUG) {
          console.log('Starting app initialization...');
          console.log('Environment variables loaded:', {
            DEBUG: CONFIG.DEBUG,
            ANALYTICS_ENABLED: CONFIG.ANALYTICS_ENABLED
          });
        }

        // Check browser support first
        const support = checkBrowserSupport();
        setBrowserSupport(support);

        if (CONFIG.DEBUG) {
          console.log('Browser support check:', support);
        }

        if (!support.isSupported) {
          setError({
            type: 'browser_unsupported',
            message: 'Your browser is not supported. Please use a modern browser like Chrome, Firefox, or Safari.',
            missingFeatures: support.missingFeatures
          });
          setIsLoading(false);
          return;
        }

        // Sign in anonymously for Firebase access
        if (CONFIG.DEBUG) {
          console.log('Starting Firebase authentication...');
        }
        
        await signInAnonymousUser();
        setIsAuthenticated(true);

        if (CONFIG.DEBUG) {
          console.log('App initialized successfully');
        }

      } catch (error) {
        console.error('Failed to initialize app:', error);
        setError({
          type: 'initialization_failed',
          message: 'Failed to initialize the recording app. Please refresh and try again.',
          details: error.message
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Loading screen
  if (isLoading) {
    return (
      <div className="page-container">
        <div className="main-layout-container">
          <div className="loading">
            <div>Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  // Error screen
  if (error) {
    return (
      <div className="page-container">
        <div className="main-layout-container">
          <div className="card-container">
            <div className="error-message">
              <h2>Unable to Load Recording App</h2>
              <p>{error.message}</p>
              {error.type === 'browser_unsupported' && (
                <div style={{ marginTop: '20px' }}>
                  <p><strong>Missing features:</strong></p>
                  <ul style={{ textAlign: 'left', marginTop: '10px' }}>
                    {error.missingFeatures.map(feature => (
                      <li key={feature}>
                        {feature === 'mediaRecorder' && 'Media Recording'}
                        {feature === 'getUserMedia' && 'Camera/Microphone Access'}
                        {feature === 'webRTC' && 'WebRTC Support'}
                        {feature === 'websockets' && 'WebSocket Support'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button 
                className="btn-base btn-primary mt-20"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main app with routing
  return (
    <ErrorBoundary>
      <div className="App">
        <Routes>
          {/* Recording route with session ID */}
          <Route 
            path="/record/:sessionId" 
            element={
              isAuthenticated ? 
                <RecordingApp /> : 
                <Navigate to="/" replace />
            } 
          />
          
          {/* Debug route */}
          <Route 
            path="/debug" 
            element={<DebugInfo />} 
          />

          {/* Home/Default route */}
          <Route 
            path="/" 
            element={<DefaultHomePage />} 
          />
          
          {/* Catch all other routes */}
          <Route 
            path="*" 
            element={<NotFoundPage />} 
          />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}

// Default home page component
const DefaultHomePage = () => {
  return (
    <div className="page-container">
      <div className="main-layout-container">
        <div className="card-container">
          <div className="card-content">
            <h1 className="heading">Love Retold</h1>
            <p className="subheading">Story Recording Platform</p>
            <p className="prompt-info-text">
              This is a story recording application. You need a valid recording link to access this service.
            </p>
            <p className="prompt-link">
              If you have a recording link, please use the full URL provided to you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 404 page component
const NotFoundPage = () => {
  return (
    <div className="page-container">
      <div className="main-layout-container">
        <div className="card-container">
          <div className="card-content">
            <h1 className="heading">Page Not Found</h1>
            <p className="subheading">The page you're looking for doesn't exist.</p>
            <p className="prompt-info-text">
              If you have a recording link, please make sure you're using the complete URL.
            </p>
            <button 
              className="btn-base btn-primary mt-20"
              onClick={() => window.location.href = '/'}
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;