import { useEffect } from 'react';
import PropTypes from 'prop-types';

const PageActionRoute = ({ pageAction, children }) => {
  useEffect(() => {
    insights.chrome.appAction(pageAction);
    return () => insights.chrome.appAction(undefined);
  }, [pageAction]);
  return children;
};

PageActionRoute.propTypes = {
  pageAction: PropTypes.string.isRequired,
};

export default PageActionRoute;
