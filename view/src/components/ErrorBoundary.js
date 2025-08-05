import React from 'react';
import { logError } from '../services/firebase';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log to Firebase
    logError('error-boundary', error, `Component Stack: ${errorInfo.componentStack}`);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-container">
          <div className="main-layout-container">
            <div className="card-container">
              <div className="error-message">
                <h2>Something went wrong</h2>
                <p>
                  We're sorry, but something unexpected happened. 
                  Please refresh the page and try again.
                </p>
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details style={{ marginTop: '20px', textAlign: 'left' }}>
                    <summary>Error Details (Development Only)</summary>
                    <pre style={{ 
                      marginTop: '10px', 
                      padding: '10px', 
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                      fontSize: '12px',
                      overflow: 'auto',
                      maxHeight: '200px'
                    }}>
                      {this.state.error.toString()}
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
                
                <div style={{ marginTop: '20px' }}>
                  <button 
                    className="btn-base btn-primary"
                    onClick={() => window.location.reload()}
                  >
                    Refresh Page
                  </button>
                  
                  <button 
                    className="btn-base btn-secondary"
                    style={{ marginLeft: '12px' }}
                    onClick={() => window.location.href = '/'}
                  >
                    Go Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;