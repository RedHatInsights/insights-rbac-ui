import React from 'react';
import PropTypes from 'prop-types';

class SilentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    /**
     * Propagate error if it does not match the configuration
     */
    if (!error.message.includes(this.props.silentErrorString)) {
      this.setState({ hasError: false });
      throw error;
    }
  }

  render() {
    if (this.state.hasError) {
      // Silently fail
      return null;
    }

    return this.props.children;
  }
}

SilentErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  silentErrorString: PropTypes.string.isRequired,
};

export default SilentErrorBoundary;
