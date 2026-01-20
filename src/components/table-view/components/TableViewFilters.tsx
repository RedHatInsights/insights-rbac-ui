/**
 * TableViewFilters Component
 *
 * Renders filter controls based on configuration.
 * Normalizes filter types (search → text, select → checkbox) internally.
 * When there's only one text filter, renders it directly without the dropdown wrapper.
 */

import React, { useMemo } from 'react';
import DataViewFilters from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import { DataViewTextFilter } from '@patternfly/react-data-view/dist/dynamic/DataViewTextFilter';
import { DataViewCheckboxFilter } from '@patternfly/react-data-view/dist/dynamic/DataViewCheckboxFilter';
import { SearchInput } from '@patternfly/react-core/dist/dynamic/components/SearchInput';
import type { FilterConfig, FilterState } from '../types';

export interface TableViewFiltersProps {
  /** Filter configuration */
  filterConfig: FilterConfig[];
  /** Current filter values */
  filters: FilterState;
  /** Callback when filters change */
  onFiltersChange?: (filters: FilterState) => void;
}

/**
 * Renders filter controls for TableView.
 * Normalizes 'search' → 'text' and 'select' → 'checkbox' internally.
 * When there's only one text filter, renders SearchInput directly without dropdown.
 */
export const TableViewFilters: React.FC<TableViewFiltersProps> = ({ filterConfig, filters, onFiltersChange }) => {
  // Normalize filter config - reduce 4 types to 2 (text vs checkbox)
  // Note: 'search' type intentionally doesn't have a label field - we provide 'Search' as default
  const normalizedFilterConfig = useMemo(
    () =>
      filterConfig.map((config) => {
        if (config.type === 'search') {
          return { ...config, type: 'text' as const, label: 'Search' };
        }
        if (config.type === 'select') {
          return { ...config, type: 'checkbox' as const };
        }
        return config;
      }),
    [filterConfig],
  );

  const handleFilterChange = (_event: unknown, newFilters: Partial<FilterState>) => {
    const mergedFilters: FilterState = { ...filters };
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined) {
        delete mergedFilters[key];
      } else {
        mergedFilters[key] = value;
      }
    });
    onFiltersChange?.(mergedFilters);
  };

  if (normalizedFilterConfig.length === 0) return null;

  // Special case: if there's only one text filter, render it directly without dropdown
  const textFilters = normalizedFilterConfig.filter((config) => config.type === 'text');
  const hasOnlyOneTextFilter = textFilters.length === 1 && normalizedFilterConfig.length === 1;

  if (hasOnlyOneTextFilter) {
    const singleFilter = textFilters[0];
    const filterValue = (filters[singleFilter.id] as string) || '';

    return (
      <SearchInput
        placeholder={singleFilter.placeholder || `Search by ${singleFilter.label.toLowerCase()}...`}
        value={filterValue}
        onChange={(_event, value) => {
          onFiltersChange?.({ [singleFilter.id]: value });
        }}
        onClear={() => {
          onFiltersChange?.({ [singleFilter.id]: '' });
        }}
        aria-label={singleFilter.label}
      />
    );
  }

  // Multiple filters or checkbox filters - use DataViewFilters wrapper
  return (
    <DataViewFilters onChange={handleFilterChange} values={filters}>
      {normalizedFilterConfig.map((config) => {
        if (config.type === 'text') {
          return <DataViewTextFilter key={config.id} filterId={config.id} title={config.label} placeholder={config.placeholder} />;
        }
        if (config.type === 'checkbox') {
          const mappedOptions = config.options.map((opt) => ({
            value: opt.id,
            label: opt.label,
          }));
          return (
            <DataViewCheckboxFilter
              key={config.id}
              filterId={config.id}
              title={config.label}
              placeholder={config.placeholder || `Filter by ${config.label.toLowerCase()}...`}
              options={mappedOptions}
            />
          );
        }
        return null;
      })}
    </DataViewFilters>
  );
};
