import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { useCallback, useRef } from 'react';

/**
 * Hook to access platform tracking/analytics.
 *
 * Returns stable callback references (never change between renders)
 * by using a ref to hold the chrome object. This prevents useEffect
 * loops when these callbacks are used in dependency arrays.
 *
 * @example
 * const { trackNavigation, setDocumentTitle } = usePlatformTracking();
 * trackNavigation('roles', true);
 */
export const usePlatformTracking = () => {
  const chrome = useChrome();
  const chromeRef = useRef(chrome);
  chromeRef.current = chrome;

  /** Track navigation click for analytics */
  const trackNavigation = useCallback((id: string, secondaryNav?: boolean) => {
    chromeRef.current.appNavClick?.({ id, secondaryNav });
  }, []);

  /** Track object view for analytics */
  const trackObjectView = useCallback((id: string) => {
    chromeRef.current.appObjectId?.(id);
  }, []);

  /** Track user action for analytics */
  const trackAction = useCallback((action?: string) => {
    if (action) {
      chromeRef.current.appAction?.(action);
    }
  }, []);

  /** Update browser document title */
  const setDocumentTitle = useCallback((title: string) => {
    chromeRef.current.updateDocumentTitle?.(title);
  }, []);

  return { trackNavigation, trackObjectView, trackAction, setDocumentTitle };
};
