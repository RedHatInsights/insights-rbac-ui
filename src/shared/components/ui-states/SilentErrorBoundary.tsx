import React, { Component, ReactNode } from 'react';

interface SilentErrorBoundaryProps {
  children: ReactNode;
  silentErrorString: string;
}

interface SilentErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class SilentErrorBoundary extends Component<SilentErrorBoundaryProps, SilentErrorBoundaryState> {
  constructor(props: SilentErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): SilentErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error): void {
    // Log the error for debugging
    if (error.message.includes(this.props.silentErrorString)) {
      console.log('SilentErrorBoundary: Silently caught error:', error.message);
    } else {
      console.error('SilentErrorBoundary: Caught non-matching error:', error.message);
    }
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Only silence errors that match our pattern
      if (this.state.error.message.includes(this.props.silentErrorString)) {
        return null; // Silent handling
      } else {
        // For non-matching errors, show a basic error message
        return <div data-testid="error-fallback">An error occurred</div>;
      }
    }

    return this.props.children;
  }
}
