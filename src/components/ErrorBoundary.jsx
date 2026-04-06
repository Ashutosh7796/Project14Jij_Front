import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole app
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('Error Boundary Caught:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // You can also log to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <AlertCircle size={64} color="#dc3545" style={styles.icon} />
            
            <h1 style={styles.title}>Oops! Something went wrong</h1>
            
            <p style={styles.message}>
              We're sorry for the inconvenience. The application encountered an unexpected error.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>Error Details (Development Only)</summary>
                <pre style={styles.errorText}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div style={styles.buttonGroup}>
              <button onClick={this.handleReset} style={styles.button}>
                <RefreshCw size={18} />
                <span>Try Again</span>
              </button>
              
              <button onClick={this.handleGoHome} style={{...styles.button, ...styles.secondaryButton}}>
                <Home size={18} />
                <span>Go Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    textAlign: 'center'
  },
  icon: {
    marginBottom: '20px'
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '16px'
  },
  message: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '24px',
    lineHeight: '1.5'
  },
  details: {
    textAlign: 'left',
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #dee2e6'
  },
  summary: {
    cursor: 'pointer',
    fontWeight: '600',
    color: '#495057',
    marginBottom: '12px'
  },
  errorText: {
    fontSize: '12px',
    color: '#dc3545',
    overflow: 'auto',
    maxHeight: '200px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    outline: 'none'
  },
  secondaryButton: {
    backgroundColor: '#6c757d'
  }
};

export default ErrorBoundary;
