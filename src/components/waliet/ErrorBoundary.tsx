"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class BettingErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[BettingErrorBoundary]", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center py-10 px-4">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-red-400">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 6V11M10 13.5V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-[13px] font-semibold text-text-secondary">Something went wrong</p>
          <p className="text-[12px] text-text-muted mt-1 mb-3">Try refreshing the page</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="h-7 px-3 rounded-md bg-bg-surface text-[12px] font-medium text-text-secondary hover:bg-bg-hover transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
