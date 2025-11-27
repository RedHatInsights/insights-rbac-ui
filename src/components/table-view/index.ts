/**
 * TableView Component Library
 *
 * A type-safe, flexible table component with:
 * - Const tuple columns for extreme TypeScript safety
 * - Decoupled filtering from columns
 * - Compound expandable rows
 * - Optional URL state synchronization
 * - Utility hooks for common checks
 */

// Types
export type {
  // Column types
  ColumnConfig,
  ColumnConfigMap,
  ExtractCompoundColumns,
  ExtractSortableColumns,
  // Renderer types
  CellRendererMap,
  ExpansionRendererMap,
  // Filter types
  FilterConfig,
  FilterState,
  // Sort types
  SortDirection,
  SortState,
  // Expansion types
  ExpandedCell,
  // Hook types
  UseTableStateOptions,
  UseTableStateReturn,
  // Component types
  TableViewProps,
  TableViewToolbarProps,
  TableViewSkeletonProps,
  TableViewEmptyStateProps,
} from './types';

// Components
export { TableView } from './TableView';

// Hooks
export { useTableState } from './hooks/useTableState';
