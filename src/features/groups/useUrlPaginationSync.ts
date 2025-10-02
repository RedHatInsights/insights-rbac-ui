import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { applyPaginationToUrl } from '../../helpers/pagination';

/**
 * Synchronizes pagination state changes to URL query parameters.
 *
 * This hook ensures that whenever pagination state changes (page, per-page, count, etc.),
 * the URL is updated to reflect the current pagination state. This enables:
 * - Deep linking to specific pages
 * - Browser back/forward navigation with correct pagination
 * - Bookmark-able URLs with pagination state
 *
 * @param limit - Items per page
 * @param offset - Current page offset (0-based)
 * @param count - Total item count
 * @param redirected - Whether pagination was redirected due to invalid state
 */
export const useUrlPaginationSync = (limit: number, offset: number, count?: number, redirected?: boolean) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    applyPaginationToUrl(location, navigate, limit, offset);
  }, [offset, limit, count, redirected]);
};
