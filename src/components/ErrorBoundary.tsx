import { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: unknown[];
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // Log to external service in production
    if (import.meta.env.PROD) {
      console.error('[ErrorBoundary]', error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.hasError && this.props.resetKeys) {
      const hasChanged = this.props.resetKeys.some(
        (key, idx) => key !== prevProps.resetKeys?.[idx]
      );
      if (hasChanged) {
        this.reset();
      }
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] items-center justify-center p-8">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger-100 dark:bg-danger-900/30">
              <ExclamationTriangleIcon className="h-8 w-8 text-danger-600 dark:text-danger-400" />
            </div>

            <h2 className="mt-4 text-xl font-semibold text-secondary-900 dark:text-white">
              Something went wrong
            </h2>

            <p className="mt-2 text-sm text-secondary-500 dark:text-secondary-400">
              An unexpected error occurred. Please try again or contact support if the problem persists.
            </p>

            {!import.meta.env.PROD && this.state.error && (
              <details className="mt-4 rounded-lg bg-secondary-50 dark:bg-secondary-800 p-4 text-left">
                <summary className="cursor-pointer text-xs font-medium text-secondary-600 dark:text-secondary-300">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 overflow-auto text-xs text-danger-600 dark:text-danger-400 whitespace-pre-wrap break-words">
                  {this.state.error.message}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      {'\n\nComponent Stack:'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={this.reset}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 px-4 py-2.5 text-sm font-medium text-secondary-700 dark:text-secondary-200 shadow-sm hover:bg-secondary-50 dark:hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
