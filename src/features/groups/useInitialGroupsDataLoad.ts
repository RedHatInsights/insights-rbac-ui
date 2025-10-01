import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { syncDefaultPaginationWithUrl } from '../../helpers/pagination';
import { syncDefaultFiltersWithUrl } from '../../helpers/urlFilters';
import { fetchAdminGroup, fetchSystemGroup } from '../../redux/groups/actions';

interface UseInitialGroupsDataLoadProps {
  pagination: {
    limit: number;
    offset: number;
    count: number;
  };
  filterValue: string;
  onFilterValueChange: (value: string) => void;
  fetchData: (params: { limit: number; offset: number; orderBy: string; filters: { name: string | null } }) => void;
}

/**
 * Handles initial component mount and data loading for Groups page.
 *
 * This hook orchestrates the complex initial loading sequence:
 * 1. Synchronizes URL query parameters with component state for pagination and filters
 * 2. Updates local filter state based on URL parameters
 * 3. Registers the page with Chrome navigation system
 * 4. Fetches the main groups data with resolved pagination/filter state
 * 5. Fetches admin and system default groups for admin users
 *
 * This runs only once on component mount to establish the initial state
 * and load all required data based on URL parameters or defaults.
 *
 * @param props - Configuration object containing pagination state, filter state, and fetch function
 */
export const useInitialGroupsDataLoad = ({ pagination, filterValue, onFilterValueChange, fetchData }: UseInitialGroupsDataLoadProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const chrome = useChrome();

  useEffect(() => {
    // Sync URL parameters with component state for pagination
    const { limit, offset } = syncDefaultPaginationWithUrl(location, navigate, {
      limit: pagination.limit,
      offset: pagination.offset,
      count: pagination.count,
      itemCount: pagination.count,
    });

    // Sync URL parameters with component state for filters
    const { name } = syncDefaultFiltersWithUrl(location, navigate, ['name'], { name: filterValue });
    onFilterValueChange(String(name || ''));

    // Register page with Chrome navigation system for proper breadcrumb/nav state
    chrome.appNavClick({ id: 'groups', secondaryNav: true });

    // Fetch main groups data with resolved pagination and filter parameters
    fetchData({ limit, offset, orderBy: 'name', filters: { name: String(name || '') || null } });

    // Fetch default groups for admin users (these show at top of list for admins)
    dispatch(fetchAdminGroup({ filterValue: String(name || ''), chrome }));
    dispatch(fetchSystemGroup({ filterValue: String(name || ''), chrome }));
  }, []); // Empty dependency array - only run on initial mount
};
