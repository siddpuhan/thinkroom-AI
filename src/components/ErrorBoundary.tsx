"use client";
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary', `Caught an error: ${error.message}`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Attempt to reload current room / route or just refresh state
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
          backgroundColor: '#0a0a0c',
          color: '#f3f4f6',
          fontFamily: 'system-ui, sans-serif',
          padding: '24px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            maxWidth: '480px',
            textAlign: 'center',
            padding: '40px',
            borderRadius: '24px',
            backgroundColor: '#111115',
            border: '1px solid #222228',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px', color: '#f3f4f6' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: '1.6', marginBottom: '24px' }}>
              ThinkRoom AI encountered an unexpected error. Don't worry, your collaborative sessions are safe.
            </p>
            {this.state.error && (
              <div style={{
                textAlign: 'left',
                backgroundColor: '#18181f',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#ef4444',
                overflowX: 'auto',
                marginBottom: '24px',
                maxHeight: '120px',
                border: '1px solid #ef444422'
              }}>
                {this.state.error.toString()}
              </div>
            )}
            <button
              onClick={this.handleReset}
              style={{
                backgroundColor: '#a855f7',
                color: '#ffffff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                outline: 'none'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#9333ea')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#a855f7')}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
