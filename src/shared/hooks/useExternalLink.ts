import { useNavigate } from 'react-router-dom';

/**
 * Hook for navigating to external paths outside this application.
 *
 * Use this for paths that are handled by other apps mounted under /iam
 * or other platform paths like /settings, /service-accounts, etc.
 *
 * For internal navigation within this app, use:
 * - useAppNavigate() with pathnames from src/utilities/pathnames.ts
 * - <AppLink> component
 *
 * For external links in JSX, use:
 * - <ExternalLink> component
 *
 * @example
 * const externalLink = useExternalLink();
 *
 * // Navigate to external path
 * externalLink.navigate('/iam/access-management/access-requests');
 */
export const useExternalLink = () => {
  const navigate = useNavigate();

  return {
    /**
     * Navigate to an external path (uses router navigation)
     */
    navigate: (path: string) => navigate(path),
  };
};

export default useExternalLink;
