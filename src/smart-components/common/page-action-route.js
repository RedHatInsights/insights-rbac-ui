import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Route } from 'react-router-dom';

const PageActionRoute = ({ pageAction, ...props }) => {
  useEffect(() => {
    insights.chrome.appAction(pageAction);
    return () => insights.chrome.appAction(undefined);
  }, [pageAction]);
  return <Route {...props} />;
};

PageActionRoute.propTypes = {
  pageAction: PropTypes.string.isRequired,
};

export default PageActionRoute;
