import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { usePlatformTracking } from '../hooks/usePlatformTracking';

const PageActionRoute = ({ pageAction, children }) => {
  const { trackAction } = usePlatformTracking();
  useEffect(() => {
    trackAction(pageAction);
    return () => trackAction(undefined);
  }, [pageAction, trackAction]);
  return children;
};

PageActionRoute.propTypes = {
  pageAction: PropTypes.string.isRequired,
};

export default PageActionRoute;
