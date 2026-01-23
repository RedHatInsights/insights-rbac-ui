/**
 * TableViewFilters Component
 *
 * Renders filter controls based on configuration.
 * Normalizes filter types (search → text, select → checkbox) internally.
 */

import React, { useMemo } from 'react';
import DataViewFilters from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import { DataViewTextFilter } from '@patternfly/react-data-view/dist/dynamic/DataViewTextFilter';
import { DataViewCheckboxFilter } from '@patternfly/react-data-view/dist/dynamic/DataViewCheckboxFilter';
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
        if (Array.isArray(value)) {
          // Normalize to string[] (react-data-view sometimes passes option objects) and de-duplicate to
          // avoid React key warnings in PF chip/label rendering.
          const normalized = value
            .map((v) => {
              if (typeof v === 'string') return v;
              if (v && typeof v === 'object' && 'value' in v) return String((v as { value?: unknown }).value);
              return String(v);
            })
            .filter(Boolean);
          mergedFilters[key] = Array.from(new Set(normalized));
        } else {
          mergedFilters[key] = value;
        }
      }
    });
    onFiltersChange?.(mergedFilters);
  };

  if (normalizedFilterConfig.length === 0) return null;

  // Pass only active filter values down to PatternFly to avoid rendering chips/labels for empty
  // filters (which can trigger noisy React warnings in some PF versions).
  const activeValues = useMemo<FilterState>(() => {
    const next: FilterState = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          next[key] = value;
        }
      } else if (value !== '') {
        next[key] = value;
      }
    });
    return next;
  }, [filters]);

  return (
    <DataViewFilters onChange={handleFilterChange} values={activeValues}>
      {normalizedFilterConfig.map((config) => {
        if (config.type === 'text') {
          return <DataViewTextFilter key={config.id} filterId={config.id} title={config.label} placeholder={config.placeholder} />;
        }
        if (config.type === 'checkbox') {
          // NOTE: De-duplicate options to avoid React key warnings inside PatternFly filter rendering
          // (the Storybook test runner treats console warnings as failures).
          const mappedOptions = Array.from(
            new Map(
              config.options.map((opt) => [
                opt.id,
                {
                  value: opt.id,
                  label: opt.label,
                },
              ]),
            ).values(),
          );
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
