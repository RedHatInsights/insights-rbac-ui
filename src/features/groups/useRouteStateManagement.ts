import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { applyPaginationToUrl, isPaginationPresentInUrl } from '../../helpers/pagination';
import { areFiltersPresentInUrl, syncDefaultFiltersWithUrl } from '../../helpers/urlFilters';
import { removeQueryParams } from '../../helpers/navigation';

/**
 * Manages URL state transitions when navigating between Groups list and detail views.
 *
 * This hook handles two different navigation scenarios:
 *
 * **List View Navigation:** When on the groups list page (/groups):
 * - Ensures pagination parameters are present in URL (adds defaults if missing)
 * - Ensures filter parameters are present if filters are active
 * - This maintains proper deep-linking and bookmarking capabilities
 *
 * **Detail View Navigation:** When navigating to group detail pages (/groups/.../detail):
 * - Removes all query parameters to clean up the URL
 * - Detail pages don't need pagination or filter state in URL
 * - Provides clean, shareable URLs for individual group pages
 *
 * This prevents URL parameter pollution and ensures consistent URL patterns
 * across different sections of the Groups feature.
 *
 * @param pagination - Current pagination state
 * @param filterValue - Current filter value
 */
export const useRouteStateManagement = (
  pagination: {
    limit: number;
    offset: number;
  },
  filterValue: string,
) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!location.pathname.includes('detail')) {
      // On list view: ensure URL has required pagination/filter parameters
      isPaginationPresentInUrl(location) || applyPaginationToUrl(location, navigate, pagination.limit, pagination.offset);
      filterValue?.length > 0 &&
        !areFiltersPresentInUrl(location, ['name']) &&
        syncDefaultFiltersWithUrl(location, navigate, ['name'], { name: filterValue });
    } else {
      // On detail view: clean up URL by removing query parameters
      removeQueryParams(location, navigate);
    }
  }, [location.pathname, pagination.limit, pagination.offset, filterValue]);
};
