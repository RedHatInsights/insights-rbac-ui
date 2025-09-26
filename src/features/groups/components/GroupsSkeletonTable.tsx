import React, { useMemo } from 'react';
import { TableVariant } from '@patternfly/react-table/dist/dynamic/components/Table';
import { SkeletonTable } from '@patternfly/react-component-groups';
import { useTableColumns } from '../useTableColumns';

interface GroupsSkeletonTableProps {
  /**
   * Whether the user has admin permissions.
   * Determines if selection column should be included.
   */
  isAdmin: boolean;
  /**
   * Number of skeleton rows to display.
   * @default 10
   */
  rowsCount?: number;
}

/**
 * Skeleton loading table for Groups component.
 *
 * This component displays a skeleton loading state that matches the structure
 * of the actual Groups table. It uses the same column configuration via
 * useTableColumns to ensure visual consistency.
 *
 * The skeleton includes:
 * - Selection column (for admin users only)
 * - All standard table columns (Name, Roles, Members, Last Modified)
 * - Actions column placeholder
 *
 * @param props - Component configuration
 */
export const GroupsSkeletonTable: React.FC<GroupsSkeletonTableProps> = ({ isAdmin, rowsCount = 10 }) => {
  const columns = useTableColumns();

  const skeletonColumns = useMemo(
    () => [
      ...(isAdmin ? [columns[0].title] : []), // Selection column placeholder for admin users
      ...columns.map((col) => col.title), // All standard table columns
      '', // Actions column placeholder
    ],
    [columns, isAdmin],
  );

  return <SkeletonTable rowsCount={rowsCount} columns={skeletonColumns} variant={TableVariant.compact} />;
};
