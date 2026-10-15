import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../layouts/AppLayout.js';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Error boundary for CLI components.
 * Catches React rendering errors and displays a friendly error message.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error details for debugging
    console.error('\n[CLI Error] An error occurred in a React component:');
    console.error(`  ${error.message}`);
    if (process.env.DEBUG_CLI) {
      console.error('  Stack:', error.stack);
      console.error('  Component Stack:', errorInfo.componentStack);
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box flexDirection="column" padding={1}>
          <Text color={colors.danger} bold>
            ❌ An error occurred
          </Text>
          <Text color={colors.muted}>{this.state.error?.message || 'Unknown error'}</Text>
          <Box marginTop={1}>
            <Text color={colors.muted}>Run with DEBUG_CLI=1 for more details, or try: npm run cli -- login</Text>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
