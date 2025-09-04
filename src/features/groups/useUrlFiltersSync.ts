import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { applyFiltersToUrl } from '../../helpers/urlFilters';

/**
 * Synchronizes filter state changes to URL query parameters.
 *
 * This hook ensures that whenever filter values change, the URL is updated
 * to reflect the current filter state. This enables:
 * - Deep linking with active filters
 * - Browser back/forward navigation with filter state preserved
 * - Shareable URLs that maintain search/filter context
 * - Consistent filter state across page reloads
 *
 * @param filterValue - Current filter value (typically search term)
 */
export const useUrlFiltersSync = (filterValue: string) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    applyFiltersToUrl(location, navigate, { name: filterValue });
  }, [filterValue]);
};
