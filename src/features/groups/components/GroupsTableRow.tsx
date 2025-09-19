import React from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { Tbody, Td, Tr } from '@patternfly/react-table/dist/dynamic/components/Table';
import { ExpandableRowContent } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Dropdown, DropdownItem, DropdownList } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { MenuToggle } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { EllipsisVIcon } from '@patternfly/react-icons';
import { DefaultInfoPopover } from './DefaultInfoPopover';
import { GroupsRolesTable } from './GroupsRolesTable';
import { GroupsMembersTable } from './GroupsMembersTable';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';
import { getDateFormat } from '../../../helpers/stringUtilities';
import { mergeToBasename } from '../../../components/navigation/AppLink';
import messages from '../../../Messages';
import pathnames from '../../../utilities/pathnames';
import type { Group } from '../types';

interface GroupsTableRowProps {
  item: Group;
  rowIndex: number;
  isAdmin: boolean;
  expanded: Record<string, number | boolean>;
  selectedRows: Group[];
  expandedCellKey: number | boolean | undefined;
  isRowExpanded: boolean;
  isSelected: Group | undefined;
  onExpandedChange: (expanded: Record<string, number | boolean>) => void;
  onSelectedRowsChange: (rows: Group[]) => void;
  onRemoveGroupsChange: (groups: Group[]) => void;
  onExpand: (event: React.MouseEvent | null, rowIndex: number, colIndex: number, isOpen: boolean, data: Group) => void;
}

export const GroupsTableRow: React.FC<GroupsTableRowProps> = ({
  item,
  rowIndex,
  isAdmin,
  expanded,
  selectedRows,
  expandedCellKey,
  isRowExpanded,
  isSelected,
  onExpandedChange,
  onSelectedRowsChange,
  onRemoveGroupsChange,
  onExpand,
}) => {
  const intl = useIntl();
  const navigate = useNavigate();

  return (
    <Tbody key={`tbody-${item.uuid}`} isExpanded={isRowExpanded}>
      {/* Main row */}
      <Tr key={`main-${item.uuid}`}>
        {isAdmin &&
          (!(item.platform_default || item.admin_default) ? (
            <Td
              select={{
                rowIndex,
                onSelect: (_event, isSelecting) => {
                  if (isSelecting) {
                    onSelectedRowsChange([...selectedRows, item]);
                  } else {
                    onSelectedRowsChange(selectedRows.filter((row) => row.uuid !== item.uuid));
                  }
                },
                isSelected: Boolean(isSelected),
              }}
            />
          ) : (
            <Td className="pf-v5-c-table__check" />
          ))}
        {/* Name */}
        <Td dataLabel="Name">
          <span>{item.name}</span>
          {(item.platform_default || item.admin_default) && (
            <DefaultInfoPopover
              id={`default${item.admin_default ? '-admin' : ''}-group-popover`}
              uuid={item.uuid}
              bodyContent={intl.formatMessage(item.admin_default ? messages.orgAdminInheritedRoles : messages.usersInheritedRoles)}
            />
          )}
        </Td>
        {/* Roles - expandable */}
        <Td
          dataLabel="Roles"
          compoundExpand={{
            isExpanded: expandedCellKey === 2,
            onToggle: () => onExpand(null, rowIndex, isAdmin ? 2 : 1, expandedCellKey === 2, item),
          }}
        >
          {item.roleCount || (item as { roleCount?: number }).roleCount || item.roles?.length || 0}
        </Td>
        {/* Members - expandable */}
        <Td
          dataLabel="Members"
          compoundExpand={
            item.platform_default || item.admin_default
              ? undefined
              : {
                  isExpanded: expandedCellKey === 3,
                  onToggle: () => onExpand(null, rowIndex, isAdmin ? 3 : 2, expandedCellKey === 3, item),
                }
          }
        >
          {item.principalCount || (item as { memberCount?: number }).memberCount || item.members?.length || 0}
        </Td>
        {/* Modified */}
        <Td dataLabel="Modified">{item.modified ? <DateFormat date={item.modified} type={getDateFormat(item.modified)} /> : ''}</Td>
        {/* Actions */}
        <Td dataLabel="Actions">
          {isAdmin && !(item.platform_default || item.admin_default) ? (
            <Dropdown
              isOpen={expanded[`actions-${item.uuid}`] === true}
              onSelect={() => onExpandedChange({ ...expanded, [`actions-${item.uuid}`]: false })}
              onOpenChange={(isOpen) => onExpandedChange({ ...expanded, [`actions-${item.uuid}`]: isOpen })}
              toggle={(toggleRef) => (
                <MenuToggle
                  ref={toggleRef}
                  aria-label={`${item.name} actions`}
                  variant="plain"
                  onClick={() => onExpandedChange({ ...expanded, [`actions-${item.uuid}`]: !expanded[`actions-${item.uuid}`] })}
                >
                  <EllipsisVIcon />
                </MenuToggle>
              )}
            >
              <DropdownList>
                <DropdownItem
                  key="edit"
                  onClick={() => {
                    const editPath = (pathnames['edit-group'].link as string).replace(':groupId', item.uuid);
                    navigate(mergeToBasename(editPath));
                  }}
                >
                  {intl.formatMessage(messages.edit)}
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  onClick={() => {
                    onRemoveGroupsChange([item]);
                    const removePath = (pathnames['remove-group'].link as string).replace(':groupId', item.uuid);
                    navigate(mergeToBasename(removePath));
                  }}
                >
                  {intl.formatMessage(messages.delete)}
                </DropdownItem>
              </DropdownList>
            </Dropdown>
          ) : null}
        </Td>
      </Tr>

      {/* Roles expansion row */}
      <Tr key={`roles-${item.uuid}`} isExpanded={isRowExpanded && expandedCellKey === 2}>
        <Td dataLabel="Roles Details" noPadding colSpan={5 + Number(isAdmin)}>
          <ExpandableRowContent>
            <GroupsRolesTable group={item} />
          </ExpandableRowContent>
        </Td>
      </Tr>

      {/* Members expansion row */}
      <Tr key={`members-${item.uuid}`} isExpanded={isRowExpanded && expandedCellKey === 3}>
        <Td dataLabel="Members Details" noPadding colSpan={5 + Number(isAdmin)}>
          <ExpandableRowContent>
            <GroupsMembersTable group={item} />
          </ExpandableRowContent>
        </Td>
      </Tr>
    </Tbody>
  );
};
