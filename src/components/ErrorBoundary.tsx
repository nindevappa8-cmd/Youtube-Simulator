import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected application error occurred.',
    };
  }

  override componentDidCatch(error: Error) {
    console.error('Application ErrorBoundary caught:', error);
  }

  override render() {
    if (this.state.hasError) {
      let friendlyMessage = this.state.message;
      try {
        const parsed = JSON.parse(this.state.message) as { error?: string; path?: string };
        if (parsed.error) {
          friendlyMessage = `${parsed.error}${parsed.path ? ` (${parsed.path})` : ''}`;
        }
      } catch {
        // Non-JSON message
      }

      return (
        <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#171717] border border-zinc-800 rounded-2xl p-8 space-y-5">
            <div className="text-xs font-mono text-[#FF3535] tracking-wider uppercase">
              System Recovery
            </div>
            <h1 className="text-2xl font-bold text-white">Something interrupted this session</h1>
            <p className="text-sm text-[#A0A0A0] leading-relaxed break-words">
              {friendlyMessage}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-[#FF2020] hover:bg-[#e01b1b] text-white text-sm font-semibold rounded-xl transition-transform active:scale-95"
            >
              Reload Studio
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
