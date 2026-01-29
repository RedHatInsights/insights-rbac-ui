import { To } from 'react-router-dom';

const BASENAME = '/iam';

export const mergeToBasename = (to: To): To => {
  if (typeof to === 'string') {
    // If the path already starts with the basename, don't add it again
    if (to.startsWith(BASENAME)) {
      return to;
    }
    // replace possible "//" after basename
    return `${BASENAME}/${to}`.replaceAll('//', '/');
  }

  // If the pathname already starts with the basename, don't add it again
  if (to.pathname?.startsWith(BASENAME)) {
    return to;
  }

  return {
    ...to,
    pathname: `${BASENAME}/${to?.pathname}`.replaceAll('//', '/'),
  };
};

/**
 * Hook that provides link generation with the /iam basename.
 * With the unified routing architecture, all routes use /iam as the basename.
 */
export const useAppLink = () => {
  return (to: To): To => {
    return mergeToBasename(to);
  };
};
