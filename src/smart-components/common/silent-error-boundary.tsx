import React from 'react';

interface SilentErrorBoundaryProps {
  children: React.ReactNode;
  silentErrorString: string;
}

interface SilentErrorBoundaryState {
  hasError: boolean;
}

class SilentErrorBoundary extends React.Component<SilentErrorBoundaryProps, SilentErrorBoundaryState> {
  constructor(props: SilentErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): SilentErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    /**
     * Propagate error if it does not match the configuration
     */
    if (!error.message.includes(this.props.silentErrorString)) {
      this.setState({ hasError: false });
      throw error;
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Silently fail
      return null;
    }

    return this.props.children;
  }
}

export default SilentErrorBoundary;
