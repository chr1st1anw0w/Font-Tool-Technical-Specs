import React, { ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangleIcon } from './icons';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--bg-canvas)] flex items-center justify-center p-4">
          <motion.div
            className="max-w-md w-full bg-[var(--bg-panel)] rounded-lg border border-[var(--border-color)] p-6 text-center shadow-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
              <AlertTriangleIcon className="w-10 h-10 text-red-500" />
            </div>
            
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
              應用程式發生錯誤
            </h2>
            
            <p className="text-[var(--text-secondary)] mb-6">
              很抱歉，應用程式遇到了意外錯誤。您可以嘗試重新載入頁面或重置應用程式狀態。
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-[var(--text-secondary)] mb-2">
                  錯誤詳情
                </summary>
                <div className="bg-[var(--bg-canvas)] p-3 rounded text-xs font-mono text-red-600 overflow-auto max-h-32">
                  <div className="mb-2">
                    <strong>錯誤訊息:</strong> {this.state.error.message}
                  </div>
                  <div>
                    <strong>堆疊追蹤:</strong>
                    <pre className="whitespace-pre-wrap mt-1">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </div>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="h-10 px-4 text-sm font-semibold rounded-md flex items-center space-x-2 bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-panel-hover)] transition-colors"
              >
                重試
              </button>
              <button
                onClick={this.handleReload}
                className="h-10 px-4 text-sm font-semibold rounded-md flex items-center space-x-2 bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] transition-all"
              >
                重新載入
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;