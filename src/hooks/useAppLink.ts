import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { To } from 'react-router-dom';

export const mergeToBasename = (to: To, basename = '/iam/user-access') => {
  if (typeof to === 'string') {
    // replace possible "//" after basename
    return `${basename}/${to}`.replaceAll('//', '/');
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

  return (to: To, linkBasename?: string): string => {
    const result = mergeToBasename(to, linkBasename || defaultBasename);

    // mergeToBasename can return a string or LocationDescriptor
    // For breadcrumbs we always need a string
    if (typeof result === 'string') {
      return result;
    }

    // If it's a LocationDescriptor, extract the pathname
    return result.pathname || '';
  };
};
