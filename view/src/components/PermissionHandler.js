import React from 'react';
import { FaVideo, FaMicrophone, FaExclamationTriangle, FaRedo } from 'react-icons/fa';

const PermissionHandler = ({ mode, error, isInitializing, onRetry }) => {
  
  const getPermissionIcon = () => {
    if (error) {
      return <FaExclamationTriangle style={{ fontSize: '3rem', color: '#d32f2f', marginBottom: '20px' }} />;
    }
    
    if (mode === 'video') {
      return <FaVideo style={{ fontSize: '3rem', color: '#666', marginBottom: '20px' }} />;
    }
    
    return <FaMicrophone style={{ fontSize: '3rem', color: '#666', marginBottom: '20px' }} />;
  };

  const getPermissionTitle = () => {
    if (error) {
      switch (error.type) {
        case 'permission_denied':
          return 'Permission Required';
        case 'no_device':
          return 'No Device Found';
        case 'not_supported':
          return 'Not Supported';
        case 'overconstrained':
          return 'Device Settings Issue';
        default:
          return 'Access Error';
      }
    }
    
    if (isInitializing) {
      return mode === 'video' ? 'Accessing Camera & Microphone' : 'Accessing Microphone';
    }
    
    return mode === 'video' ? 'Camera & Microphone Access Required' : 'Microphone Access Required';
  };

  const getPermissionMessage = () => {
    if (error) {
      return error.message;
    }
    
    if (isInitializing) {
      return 'Please allow access when prompted by your browser...';
    }
    
    if (mode === 'video') {
      return 'This app needs access to your camera and microphone to record your video response.';
    }
    
    return 'This app needs access to your microphone to record your audio response.';
  };

  const getInstructions = () => {
    if (error) {
      switch (error.type) {
        case 'permission_denied':
          return (
            <div style={{ marginTop: '20px', fontSize: '0.9rem', color: '#666', lineHeight: '1.5' }}>
              <p><strong>To enable permissions:</strong></p>
              <ol style={{ textAlign: 'left', marginTop: '10px', paddingLeft: '20px' }}>
                <li>Look for a camera/microphone icon in your browser's address bar</li>
                <li>Click it and select "Allow"</li>
                <li>Or go to your browser settings and enable camera/microphone access for this site</li>
                <li>Refresh the page and try again</li>
              </ol>
            </div>
          );
        
        case 'no_device':
          return (
            <div style={{ marginTop: '20px', fontSize: '0.9rem', color: '#666', lineHeight: '1.5' }}>
              <p><strong>Troubleshooting steps:</strong></p>
              <ul style={{ textAlign: 'left', marginTop: '10px', paddingLeft: '20px' }}>
                <li>Check that your camera and microphone are properly connected</li>
                <li>Make sure they're not being used by another application</li>
                <li>Try refreshing the page</li>
                <li>Restart your browser if the problem persists</li>
              </ul>
            </div>
          );
        
        case 'not_supported':
          return (
            <div style={{ marginTop: '20px', fontSize: '0.9rem', color: '#666', lineHeight: '1.5' }}>
              <p><strong>Supported browsers:</strong></p>
              <ul style={{ textAlign: 'left', marginTop: '10px', paddingLeft: '20px' }}>
                <li>Chrome (recommended)</li>
                <li>Firefox</li>
                <li>Safari (iOS 14.3+)</li>
                <li>Edge</li>
              </ul>
              <p style={{ marginTop: '10px' }}>Please try using a different browser.</p>
            </div>
          );
        
        default:
          return null;
      }
    }
    
    if (!isInitializing) {
      return (
        <div style={{ marginTop: '20px', fontSize: '0.9rem', color: '#666', lineHeight: '1.5' }}>
          <p>Your browser will ask for permission to access your {mode === 'video' ? 'camera and microphone' : 'microphone'}.</p>
          <p>Click "Allow" when prompted to continue.</p>
        </div>
      );
    }
    
    return null;
  };

  const canRetry = error && error.type !== 'not_supported';

  return (
    <div className="card-content" style={{ textAlign: 'center' }}>
      {getPermissionIcon()}
      
      <h2 className="heading" style={{ marginBottom: '16px' }}>
        {getPermissionTitle()}
      </h2>
      
      <p className="subheading" style={{ marginBottom: '20px' }}>
        {getPermissionMessage()}
      </p>

      {/* Loading indicator */}
      {isInitializing && (
        <div style={{ margin: '20px 0' }}>
          <div className="loading-spinner" />
          <p style={{ marginTop: '10px', color: '#666', fontSize: '0.9rem' }}>
            Waiting for permission...
          </p>
        </div>
      )}

      {/* Action buttons */}
      {!isInitializing && (
        <div style={{ marginTop: '30px' }}>
          {canRetry ? (
            <button
              className="btn-base btn-primary"
              onClick={onRetry}
              style={{ minWidth: '140px' }}
            >
              <FaRedo style={{ marginRight: '8px' }} />
              Try Again
            </button>
          ) : error?.type === 'not_supported' ? (
            <button
              className="btn-base btn-secondary"
              onClick={() => window.location.href = '/'}
            >
              Go Back
            </button>
          ) : (
            <button
              className="btn-base btn-primary"
              onClick={onRetry}
              style={{ minWidth: '140px' }}
            >
              {mode === 'video' ? 'Enable Camera & Mic' : 'Enable Microphone'}
            </button>
          )}
        </div>
      )}

      {getInstructions()}

      {/* Browser-specific help */}
      {error?.type === 'permission_denied' && (
        <details style={{ 
          marginTop: '30px', 
          textAlign: 'left',
          fontSize: '0.8rem',
          color: '#666',
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderRadius: '6px',
          border: '1px solid #e9ecef'
        }}>
          <summary style={{ cursor: 'pointer', fontWeight: '500' }}>
            Browser-specific instructions
          </summary>
          
          <div style={{ marginTop: '10px' }}>
            <p><strong>Chrome:</strong></p>
            <p>Click the camera icon in the address bar, or go to Settings → Privacy and Security → Site Settings → Camera/Microphone</p>
            
            <p style={{ marginTop: '10px' }}><strong>Firefox:</strong></p>
            <p>Click the shield icon or camera icon in the address bar</p>
            
            <p style={{ marginTop: '10px' }}><strong>Safari:</strong></p>
            <p>Go to Safari → Settings → Websites → Camera/Microphone</p>
            
            <p style={{ marginTop: '10px' }}><strong>Edge:</strong></p>
            <p>Click the camera icon in the address bar, or go to Settings → Cookies and site permissions</p>
          </div>
        </details>
      )}

      <style jsx>{`
        .loading-spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PermissionHandler;