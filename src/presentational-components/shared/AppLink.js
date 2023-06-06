import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

export const mergeToBasename = (to, basename = '/iam/user-access') => {
  if (typeof to === 'string') {
    // replace possible "//" after basename
    return `${basename}/${to}`.replaceAll('//', '/');
  }

  return {
    ...to,
    pathname: `${basename}/${to.pathname}`.replaceAll('//', '/'),
  };
};

const AppLink = React.forwardRef((props, ref) => <Link {...props} ref={ref} to={mergeToBasename(props.to, props.linkBasename)} />);
AppLink.displayName = 'AppLink';

AppLink.propTypes = {
  to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  linkBasename: PropTypes.string,
};

export default AppLink;
