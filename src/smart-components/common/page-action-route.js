import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';

const PageActionRoute = ({ pageAction, children }) => {
  const chrome = useChrome();
  useEffect(() => {
    chrome.appAction(pageAction);
    return () => chrome.appAction(undefined);
  }, [pageAction]);
  return children;
};

PageActionRoute.propTypes = {
  pageAction: PropTypes.string.isRequired,
};

export default PageActionRoute;
