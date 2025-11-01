import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  // FIX: Initialize state as a class property to fix errors where `this.state` was not found.
  public state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--primary-deep-blue)] flex items-center justify-center p-4">
          <motion.div
            className="max-w-md w-full bg-[var(--neutral-gray-800)] rounded-lg border border-[var(--neutral-gray-700)] p-6 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">
              應用程式發生錯誤
            </h2>
            
            <p className="text-[var(--neutral-gray-400)] mb-6">
              很抱歉，應用程式遇到了意外錯誤。您可以嘗試重新載入頁面或重置應用程式狀態。
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-[var(--neutral-gray-300)] mb-2">
                  錯誤詳情
                </summary>
                <div className="bg-[var(--neutral-gray-900)] p-3 rounded text-xs font-mono text-red-400 overflow-auto max-h-32">
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
                className="px-4 py-2 bg-[var(--neutral-gray-700)] border border-[var(--neutral-gray-600)] text-[var(--neutral-gray-200)] rounded-lg hover:bg-[var(--neutral-gray-600)] transition-colors"
              >
                重試
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-gradient-to-r from-[var(--primary-tech-blue)] to-[var(--primary-sky-blue)] text-white rounded-lg hover:shadow-lg transition-all"
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
