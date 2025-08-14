'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          minHeight: '100vh',
          padding: '20px',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
          <h1>エラーが発生しました</h1>
          <p>アプリケーションでエラーが発生しました。</p>
          <details style={{ marginTop: '20px', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '5px' }}>
            <summary>エラー詳細</summary>
            <pre style={{ fontSize: '12px', marginTop: '10px' }}>
              {this.state.error?.toString()}
            </pre>
          </details>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ 
              marginTop: '20px', 
              padding: '10px 20px', 
              background: 'rgba(255,255,255,0.2)', 
              border: 'none', 
              borderRadius: '5px', 
              color: 'white', 
              cursor: 'pointer' 
            }}
          >
            リトライ
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;