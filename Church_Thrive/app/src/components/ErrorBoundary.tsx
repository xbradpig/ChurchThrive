'use client';

import React, { Component, ReactNode } from 'react';
import { CTButton } from './atoms/CTButton';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--ct-color-bg)] p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-2">
              오류가 발생했습니다
            </h2>

            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
              예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 다시 시도해주세요.
            </p>

            {this.state.error && (
              <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs text-gray-700 dark:text-gray-300 font-mono overflow-auto max-h-32">
                {this.state.error.message}
              </div>
            )}

            <div className="flex gap-3">
              <CTButton
                variant="secondary"
                fullWidth
                onClick={() => window.location.href = '/'}
              >
                홈으로 돌아가기
              </CTButton>
              <CTButton
                variant="primary"
                fullWidth
                onClick={this.handleReset}
              >
                다시 시도
              </CTButton>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
