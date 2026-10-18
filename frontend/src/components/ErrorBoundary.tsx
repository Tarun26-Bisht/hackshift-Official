"use client";
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
          <p className="text-sm font-semibold text-red-700">Failed to render this section</p>
          <p className="text-xs text-red-500 mt-1">{this.state.error?.message || 'Unexpected component error'}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-3 px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
