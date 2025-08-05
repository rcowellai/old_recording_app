import React from 'react';
import { useNavigate } from 'react-router-dom';

const SessionValidator = ({ error, sessionId }) => {
  const navigate = useNavigate();

  const getErrorIcon = (errorType) => {
    switch (errorType) {
      case 'expired':
        return '⏰';
      case 'completed':
        return '✅';
      case 'removed':
        return '🗑️';
      case 'network_error':
        return '🌐';
      case 'invalid_url':
        return '🔗';
      default:
        return '⚠️';
    }
  };

  const getErrorTitle = (errorType) => {
    switch (errorType) {
      case 'expired':
        return 'Recording Link Expired';
      case 'completed':
        return 'Already Recorded';
      case 'removed':
        return 'Question Removed';
      case 'network_error':
        return 'Connection Error';
      case 'invalid_url':
        return 'Invalid Link';
      default:
        return 'Unable to Load';
    }
  };

  const getErrorActions = (errorType) => {
    switch (errorType) {
      case 'network_error':
        return (
          <div style={{ marginTop: '20px' }}>
            <button 
              className="btn-base btn-primary"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        );
      
      case 'invalid_url':
        return (
          <div style={{ marginTop: '20px' }}>
            <button 
              className="btn-base btn-secondary"
              onClick={() => navigate('/')}
            >
              Go Home
            </button>
          </div>
        );
      
      case 'expired':
      case 'completed':
      case 'removed':
      default:
        return (
          <div style={{ marginTop: '20px' }}>
            <p style={{ 
              fontSize: '0.9rem', 
              color: '#666', 
              marginBottom: '15px' 
            }}>
              Please contact the person who sent you this link for assistance.
            </p>
            <button 
              className="btn-base btn-secondary"
              onClick={() => navigate('/')}
            >
              Go Home
            </button>
          </div>
        );
    }
  };

  return (
    <div className="card-content">
      <div style={{ 
        fontSize: '4rem', 
        marginBottom: '20px',
        opacity: 0.7
      }}>
        {getErrorIcon(error?.type)}
      </div>
      
      <h1 className="heading">
        {getErrorTitle(error?.type)}
      </h1>
      
      <p className="subheading" style={{ marginBottom: '20px' }}>
        {error?.message || 'An unexpected error occurred.'}
      </p>

      {/* Additional context for specific error types */}
      {error?.type === 'expired' && (
        <div className="prompt-info-text">
          Recording links are valid for 30 days from creation. 
          This link has expired and can no longer be used.
        </div>
      )}

      {error?.type === 'completed' && (
        <div className="prompt-info-text">
          This recording has already been completed. 
          Each recording link can only be used once.
        </div>
      )}

      {error?.type === 'removed' && (
        <div className="prompt-info-text">
          The person who created this recording request has removed it.
        </div>
      )}

      {error?.type === 'network_error' && (
        <div className="prompt-info-text">
          Please check your internet connection and try again.
        </div>
      )}

      {error?.type === 'invalid_url' && (
        <div className="prompt-info-text">
          Make sure you're using the complete recording URL that was provided to you.
        </div>
      )}

      {getErrorActions(error?.type)}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <details style={{ 
          marginTop: '30px', 
          textAlign: 'left',
          fontSize: '0.8rem',
          color: '#666',
          backgroundColor: '#f5f5f5',
          padding: '10px',
          borderRadius: '4px'
        }}>
          <summary>Debug Info</summary>
          <pre style={{ marginTop: '10px' }}>
            {JSON.stringify({ 
              sessionId, 
              error: error 
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};

export default SessionValidator;