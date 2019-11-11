import React, { Suspense, Fragment } from 'react';
import PropTypes from 'prop-types';

const asyncComponent = (asyncFunction, callback, props) => React.lazy(() => asyncFunction().then(data => ({
  default: () => callback(data, props)
})));

const SuspendComponent = ({ asyncFunction, callback, fallback, ...props }) => {
  const Async = asyncComponent(asyncFunction, callback, props);
  return (
    <Suspense fallback={ fallback || <Fragment /> }>
      <Async />
    </Suspense>
  );
};

SuspendComponent.propTypes = {
  asyncFunction: PropTypes.func,
  callback: PropTypes.func,
  fallback: PropTypes.node
};

export default SuspendComponent;
