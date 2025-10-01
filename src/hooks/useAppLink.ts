import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { To } from 'react-router-dom';

export const mergeToBasename = (to: To, basename = '/iam/user-access') => {
  if (typeof to === 'string') {
    // If the path already starts with the basename, don't add it again
    if (to.startsWith(basename)) {
      return to;
    }
    // replace possible "//" after basename
    return `${basename}/${to}`.replaceAll('//', '/');
  }

  // If the pathname already starts with the basename, don't add it again
  if (to.pathname?.startsWith(basename)) {
    return to;
  }

  return {
    ...to,
    pathname: `${basename}/${to?.pathname}`.replaceAll('//', '/'),
  };
};

/**
 * Hook that provides the same basename logic as AppLink component
 * but returns a function to convert links to properly prefixed strings
 */
export const useAppLink = () => {
  const { getBundle, getApp } = useChrome();
  const defaultBasename = `/${getBundle()}/${getApp()}`;

  return (to: To, linkBasename?: string): To => {
    return mergeToBasename(to, linkBasename || defaultBasename);
  };
};
