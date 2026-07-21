import React, { Component, ErrorInfo, ReactNode } from 'react';

import { Sentry } from '../../utils/sentry';
import { ServerError } from '../pages/ServerError';

interface Props {
  children?: ReactNode;
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
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);

    // Report to Sentry for production monitoring
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    // In a real app we might want to clear specific state or force a reload
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return <ServerError error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}
