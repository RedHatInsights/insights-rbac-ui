import React from 'react';
import { useIntl } from 'react-intl';
import { Table, Th, Thead, Tr } from '@patternfly/react-table/dist/dynamic/components/Table';
import { GroupsTableRow } from './GroupsTableRow';

import type { Group } from '../types';
import { commonMessages } from '../../../../shared/messages/common';

interface GroupsTableContentProps {
  data: Group[];
  isAdmin: boolean;
  sortByState: { index: number; direction: 'asc' | 'desc' };
  selectedRows: Group[];
  selectableItemsCount: number;
  expanded: Record<string, number | boolean>;
  onExpandedChange: (expanded: Record<string, number | boolean>) => void;
  onSelectedRowsChange: (rows: Group[]) => void;
  onRemoveGroupsChange: (groups: Group[]) => void;
  handleBulkSelect: (type: 'page' | 'none') => void;
  handleSort: (event: React.MouseEvent, index: number, direction: 'asc' | 'desc') => void;
  onExpand: (event: React.MouseEvent | null, rowIndex: number, colIndex: number, isOpen: boolean, data: Group) => void;
}

export const GroupsTableContent: React.FC<GroupsTableContentProps> = ({
  data,
  isAdmin,
  sortByState,
  selectedRows,
  expanded,
  onExpandedChange,
  onSelectedRowsChange,
  onRemoveGroupsChange,
  handleSort,
  onExpand,
}) => {
  const intl = useIntl();

  return (
    <Table role="grid" aria-label={intl.formatMessage(commonMessages.groups)}>
      <Thead>
        <Tr>
          {isAdmin && <Th screenReaderText="Row selection" />}
          {/* Name column */}
          <Th
            sort={{
              sortBy: {
                index: sortByState.index,
                direction: sortByState.direction,
              },
              onSort: handleSort,
              columnIndex: isAdmin ? 1 : 0,
            }}
          >
            {intl.formatMessage(commonMessages.name)}
          </Th>
          <Th>{intl.formatMessage(commonMessages.roles)}</Th>
          <Th>{intl.formatMessage(commonMessages.members)}</Th>
          <Th
            sort={{
              sortBy: {
                index: sortByState.index,
                direction: sortByState.direction,
              },
              onSort: handleSort,
              columnIndex: isAdmin ? 4 : 3,
            }}
          >
            {intl.formatMessage(commonMessages.lastModified)}
          </Th>
          <Th screenReaderText="Actions" width={10} style={{ width: '1%' }} />
        </Tr>
      </Thead>
      {data.map((item: Group, rowIndex: number) => {
        const expandedCellKey = expanded[item.uuid];
        const isRowExpanded = expandedCellKey !== undefined && expandedCellKey !== -1;
        const isSelected = selectedRows.find((row) => row.uuid === item.uuid);

        return (
          <GroupsTableRow
            key={`row-${item.uuid}`}
            item={item}
            rowIndex={rowIndex}
            isAdmin={isAdmin}
            expanded={expanded}
            selectedRows={selectedRows}
            expandedCellKey={expandedCellKey}
            isRowExpanded={isRowExpanded}
            isSelected={isSelected}
            onExpandedChange={onExpandedChange}
            onSelectedRowsChange={onSelectedRowsChange}
            onRemoveGroupsChange={onRemoveGroupsChange}
            onExpand={onExpand}
          />
        );
      })}
    </Table>
  );
};
