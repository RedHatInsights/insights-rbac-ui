/**
 * useGroupsMutationRefresh Hook
 *
 * Encapsulates the refresh logic after mutations (add/edit/remove groups).
 * Handles clearing filters, resetting pagination, and deselecting removed rows.
 */

import { useCallback } from 'react';
import type { FetchGroupsParams } from './useGroupsFetcher';
import type { Group } from './types';

interface TableStateApi {
  apiParams: FetchGroupsParams;
  selectedRows: Group[];
  clearAllFilters: () => void;
  onSelectRow: (row: Group, selected: boolean) => void;
}

interface RefreshOptions {
  /** Clear all filters (triggers onStaleData automatically) */
  clearFilters?: boolean;
  /** Reset to first page */
  resetPage?: boolean;
  /** IDs of removed groups to deselect */
  removedIds?: string[];
}

export function useGroupsMutationRefresh(tableState: TableStateApi, fetchData: (params: FetchGroupsParams) => void) {
  return useCallback(
    ({ clearFilters, resetPage, removedIds }: RefreshOptions = {}) => {
      if (clearFilters) {
        // Clearing filters triggers onStaleData automatically
        tableState.clearAllFilters();
      } else {
        const params = resetPage ? { ...tableState.apiParams, offset: 0 } : tableState.apiParams;
        fetchData(params);
      }

      // Deselect removed rows
      if (removedIds?.length) {
        tableState.selectedRows.filter((row) => removedIds.includes(row.uuid)).forEach((row) => tableState.onSelectRow(row, false));
      }
    },
    [tableState, fetchData],
  );
}
