import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { useCallback } from 'react';

/**
 * Hook to access platform tracking/analytics.
 *
 * @example
 * const { trackNavigation, setDocumentTitle } = usePlatformTracking();
 * trackNavigation('roles', true);
 */
export const usePlatformTracking = () => {
  const chrome = useChrome();

  /** Track navigation click for analytics */
  const trackNavigation = useCallback(
    (id: string, secondaryNav?: boolean) => {
      chrome.appNavClick?.({ id, secondaryNav });
    },
    [chrome],
  );

  /** Track object view for analytics */
  const trackObjectView = useCallback(
    (id: string) => {
      chrome.appObjectId?.(id);
    },
    [chrome],
  );

  /** Track user action for analytics */
  const trackAction = useCallback(
    (action?: string) => {
      if (action) {
        chrome.appAction?.(action);
      }
    },
    [chrome],
  );

  /** Update browser document title */
  const setDocumentTitle = useCallback(
    (title: string) => {
      chrome.updateDocumentTitle?.(title);
    },
    [chrome],
  );

  return { trackNavigation, trackObjectView, trackAction, setDocumentTitle };
};
