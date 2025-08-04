import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { compoundExpand, nowrap, sortable } from '@patternfly/react-table';
import messages from '../../Messages';

/**
 * Generates table column definitions for the Groups table.
 *
 * This hook provides the standardized column configuration used across
 * the Groups table components. The columns include:
 * - Name (sortable)
 * - Roles (expandable)
 * - Members (expandable)
 * - Last Modified (sortable)
 *
 * Each column includes appropriate PatternFly transforms for sorting,
 * expansion, and text wrapping behavior.
 *
 * @returns Array of column definitions with titles, keys, and transforms
 */
export const useTableColumns = () => {
  const intl = useIntl();

  const columns = useMemo(
    () => [
      { title: intl.formatMessage(messages.name), key: 'name', transforms: [sortable] },
      { title: intl.formatMessage(messages.roles), cellTransforms: [compoundExpand], transforms: [nowrap] },
      { title: intl.formatMessage(messages.members), cellTransforms: [compoundExpand], transforms: [nowrap] },
      { title: intl.formatMessage(messages.lastModified), key: 'modified', transforms: [sortable] },
    ],
    [intl],
  );

  return columns;
};
