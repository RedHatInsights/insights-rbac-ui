import React from 'react';
import { ExpandableRowContent, Table, TableVariant, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { Checkbox, Dropdown, DropdownItem, DropdownList, MenuToggle, MenuToggleElement, Text } from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons';
import { SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import { useIntl } from 'react-intl';
import { DateFormat } from '@redhat-cloud-services/frontend-components/DateFormat';
import { getDateFormat } from '../../../helpers/stringUtilities';
import { AppLink } from '../../../components/navigation/AppLink';
import { DefaultInfoPopover } from '../components/DefaultInfoPopover';
import messages from '../../../Messages';
import { EmptyGroupsState } from './EmptyGroupsState';
import type { Group, GroupsTableProps } from '../types';

// Nested table for expanded roles
const RolesTable: React.FC<{ group: Group }> = ({ group }) => {
  const intl = useIntl();

  const compoundRolesCells = [
    intl.formatMessage(messages.roleName),
    intl.formatMessage(messages.description),
    intl.formatMessage(messages.lastModified),
  ];

  if (!group.roles || group.isLoadingRoles) {
    return (
      <Table aria-label={`Roles for ${group.name}`} variant={TableVariant.compact} ouiaId={`compound-roles-${group.uuid}`}>
        <Thead>
          <Tr>
            {compoundRolesCells.map((cell, index) => (
              <Th key={index}>{cell}</Th>
            ))}
          </Tr>
        </Thead>
        <SkeletonTableBody rowsCount={3} columnsCount={compoundRolesCells.length} />
      </Table>
    );
  }

  return (
    <Table aria-label={`Roles for ${group.name}`} variant={TableVariant.compact} ouiaId={`compound-roles-${group.uuid}`}>
      <Thead>
        <Tr>
          {compoundRolesCells.map((cell, index) => (
            <Th key={index}>{cell}</Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {group.roles.length > 0 ? (
          group.roles.map((role: any, index: number) => (
            <Tr key={index}>
              <Td dataLabel={compoundRolesCells[0]}>{role.name}</Td>
              <Td dataLabel={compoundRolesCells[1]}>{role.description}</Td>
              <Td dataLabel={compoundRolesCells[2]}>
                <DateFormat date={role.modified} type={getDateFormat(role.modified)} />
              </Td>
            </Tr>
          ))
        ) : (
          <Tr>
            <Td colSpan={compoundRolesCells.length}>
              <Text className="pf-v5-u-mx-lg pf-v5-u-my-sm">{intl.formatMessage(messages.noGroupRoles)}</Text>
            </Td>
          </Tr>
        )}
      </Tbody>
    </Table>
  );
};

// Nested table for expanded members
const MembersTable: React.FC<{ group: Group }> = ({ group }) => {
  const intl = useIntl();

  const compoundMembersCells = [
    intl.formatMessage(messages.orgAdmin),
    intl.formatMessage(messages.firstName),
    intl.formatMessage(messages.lastName),
    intl.formatMessage(messages.username),
    intl.formatMessage(messages.email),
    intl.formatMessage(messages.status),
  ];

  if (!group.members || group.isLoadingMembers) {
    return (
      <Table aria-label={`Members for ${group.name}`} variant={TableVariant.compact} ouiaId={`compound-members-${group.uuid}`}>
        <Thead>
          <Tr>
            {compoundMembersCells.map((cell, index) => (
              <Th key={index}>{cell}</Th>
            ))}
          </Tr>
        </Thead>
        <SkeletonTableBody rowsCount={3} columnsCount={compoundMembersCells.length} />
      </Table>
    );
  }

  return (
    <Table aria-label={`Members for ${group.name}`} variant={TableVariant.compact} ouiaId={`compound-members-${group.uuid}`}>
      <Thead>
        <Tr>
          {compoundMembersCells.map((cell, index) => (
            <Th key={index}>{cell}</Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {group.members.length > 0 ? (
          group.members.map((member: any, index: number) => (
            <Tr key={index}>
              <Td dataLabel={compoundMembersCells[0]}>{member.is_org_admin ? 'Yes' : 'No'}</Td>
              <Td dataLabel={compoundMembersCells[1]}>{member.first_name}</Td>
              <Td dataLabel={compoundMembersCells[2]}>{member.last_name}</Td>
              <Td dataLabel={compoundMembersCells[3]}>{member.username}</Td>
              <Td dataLabel={compoundMembersCells[4]}>{member.email}</Td>
              <Td dataLabel={compoundMembersCells[5]}>{member.is_active ? 'Active' : 'Inactive'}</Td>
            </Tr>
          ))
        ) : (
          <Tr>
            <Td colSpan={compoundMembersCells.length}>
              <Text className="pf-v5-u-mx-lg pf-v5-u-my-sm">{intl.formatMessage(messages.noGroupMembers)}</Text>
            </Td>
          </Tr>
        )}
      </Tbody>
    </Table>
  );
};

// Row actions dropdown for individual groups
const GroupRowActions: React.FC<{
  group: Group;
  onEditGroup: (groupId: string) => void;
  onDeleteGroups: (groupIds: string[]) => void;
}> = ({ group, onEditGroup, onDeleteGroups }) => {
  const intl = useIntl();
  const [isOpen, setIsOpen] = React.useState(false);

  // Default groups don't have actions
  if (group.platform_default || group.admin_default) {
    return null;
  }

  const onToggle = (isOpen: boolean) => {
    setIsOpen(isOpen);
  };

  const onSelect = () => {
    setIsOpen(false);
  };

  const handleEdit = () => {
    onEditGroup(group.uuid);
    onSelect();
  };

  const handleDelete = () => {
    onDeleteGroups([group.uuid]);
    onSelect();
  };

  return (
    <Dropdown
      isOpen={isOpen}
      onSelect={onSelect}
      onOpenChange={(isOpen: boolean) => onToggle(isOpen)}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle ref={toggleRef} aria-label="Group row actions" variant="plain" onClick={() => onToggle(!isOpen)} isExpanded={isOpen}>
          <EllipsisVIcon />
        </MenuToggle>
      )}
      shouldFocusToggleOnSelect
    >
      <DropdownList>
        <DropdownItem key="edit" onClick={handleEdit}>
          {intl.formatMessage(messages.edit)}
        </DropdownItem>
        <DropdownItem key="delete" onClick={handleDelete}>
          {intl.formatMessage(messages.delete)}
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
};

export const GroupsTable: React.FC<GroupsTableProps> = ({
  groups,
  isLoading,
  isAdmin,
  selectedRows,
  expandedCells,
  sortByState,
  hasActiveFilters,
  onRowSelection,
  onExpansion,
  onSort,
  onEditGroup,
  onDeleteGroups,
}) => {
  const intl = useIntl();

  const columns = [
    { title: intl.formatMessage(messages.name), key: 'name' },
    { title: intl.formatMessage(messages.roles), key: 'roles' },
    { title: intl.formatMessage(messages.members), key: 'members' },
    { title: intl.formatMessage(messages.lastModified), key: 'modified' },
  ];

  // Add selection and actions columns for admin users
  const allColumns = isAdmin ? [{ title: '', key: 'selection' }, ...columns, { title: '', key: 'actions' }] : [...columns];

  // const handleSelectAll = (isChecking: boolean) => {
  //   if (isChecking) {
  //     // Select all non-default groups
  //     const selectableGroups = groups.filter((group) => !group.platform_default && !group.admin_default);
  //     onRowSelection(selectableGroups);
  //   } else {
  //     onRowSelection([]);
  //   }
  // };

  const handleRowSelect = (group: Group, isChecking: boolean) => {
    if (isChecking) {
      onRowSelection([...selectedRows, group]);
    } else {
      onRowSelection(selectedRows.filter((row) => row.uuid !== group.uuid));
    }
  };

  const isRowSelected = (group: Group) => {
    return selectedRows.some((row) => row.uuid === group.uuid);
  };

  const compoundExpandParams = (group: Group, columnKey: string, rowIndex: number, columnIndex: number) => ({
    isExpanded: expandedCells[group.uuid] === columnKey,
    onToggle: () => onExpansion(group.uuid, columnKey, expandedCells[group.uuid] !== columnKey),
    expandId: `compound-${columnKey}-${group.uuid}`,
    rowIndex,
    columnIndex,
  });

  const getSortParams = (columnIndex: number) => ({
    sort: {
      sortBy: {
        index: sortByState.index,
        direction: sortByState.direction,
      },
      onSort: (_event: any, index: number, direction: 'asc' | 'desc') => onSort(_event, index, direction),
      columnIndex,
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <Table aria-label={intl.formatMessage(messages.groups)}>
        <SkeletonTableHead columns={allColumns.map((col) => col.title)} />
        <SkeletonTableBody rowsCount={10} columnsCount={allColumns.length} />
      </Table>
    );
  }

  // Empty state
  if (groups.length === 0) {
    return (
      <Table aria-label={intl.formatMessage(messages.groups)}>
        <Thead>
          <Tr>
            {allColumns.map((column, index) => (
              <Th key={index}>{column.title}</Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td colSpan={allColumns.length}>
              <EmptyGroupsState hasActiveFilters={hasActiveFilters} />
            </Td>
          </Tr>
        </Tbody>
      </Table>
    );
  }

  // const selectableGroups = groups.filter((group) => !group.platform_default && !group.admin_default);
  // const allSelectableSelected = selectableGroups.length > 0 && selectableGroups.every((group) => isRowSelected(group));
  // const someSelectableSelected = selectableGroups.some((group) => isRowSelected(group));

  return (
    <Table isExpandable aria-label={intl.formatMessage(messages.groups)}>
      <Thead>
        <Tr>
          {isAdmin && (
            <Th className="pf-v5-c-table__check" screenReaderText="Row selection">
              {/* Empty header for row selection column - select all is in toolbar */}
            </Th>
          )}
          <Th {...(columns[0].key ? getSortParams(isAdmin ? 1 : 0) : {})}>{columns[0].title}</Th>
          <Th>{columns[1].title}</Th>
          <Th>{columns[2].title}</Th>
          <Th {...getSortParams(isAdmin ? 4 : 3)}>{columns[3].title}</Th>
          {isAdmin && <Th screenReaderText="Row actions"></Th>}
        </Tr>
      </Thead>

      {groups.map((group, rowIndex) => {
        const expandedCellKey = expandedCells[group.uuid];
        const isRowExpanded = !!expandedCellKey;
        const canSelect = isAdmin && !group.platform_default && !group.admin_default;

        return (
          <Tbody key={group.uuid} isExpanded={isRowExpanded}>
            <Tr>
              {isAdmin && (
                <Td className="pf-v5-c-table__check">
                  {canSelect ? (
                    <Checkbox
                      id={`select-${group.uuid}`}
                      isChecked={isRowSelected(group)}
                      onChange={(_event, isChecking) => handleRowSelect(group, isChecking)}
                      aria-label={`Select ${group.name}`}
                    />
                  ) : null}
                </Td>
              )}

              <Td dataLabel={columns[0].title} component="th">
                {isAdmin ? (
                  <>
                    <AppLink to={`/groups/detail/${group.uuid}/roles`} state={{ uuid: group.uuid }}>
                      {group.name}
                    </AppLink>
                    {(group.platform_default || group.admin_default) && (
                      <DefaultInfoPopover
                        id={`default${group.admin_default ? '-admin' : ''}-group-popover`}
                        uuid={group.uuid}
                        bodyContent={intl.formatMessage(group.admin_default ? messages.orgAdminInheritedRoles : messages.usersInheritedRoles)}
                      />
                    )}
                  </>
                ) : (
                  group.name
                )}
              </Td>

              <Td dataLabel={columns[1].title} compoundExpand={compoundExpandParams(group, 'roles', rowIndex, 1)}>
                {group.roleCount}
              </Td>

              <Td
                dataLabel={columns[2].title}
                {...(group.platform_default || group.admin_default
                  ? { className: 'rbac-c-not-expandable-cell' }
                  : { compoundExpand: compoundExpandParams(group, 'members', rowIndex, 2) })}
              >
                {group.principalCount}
              </Td>

              <Td dataLabel={columns[3].title}>{group.modified ? <DateFormat date={group.modified} type={getDateFormat(group.modified)} /> : '-'}</Td>

              {isAdmin && (
                <Td className="pf-v5-c-table__action">
                  <GroupRowActions group={group} onEditGroup={onEditGroup} onDeleteGroups={onDeleteGroups} />
                </Td>
              )}
            </Tr>

            {/* Expanded row for roles */}
            <Tr isExpanded={isRowExpanded && expandedCellKey === 'roles'}>
              <Td dataLabel="Roles" noPadding colSpan={allColumns.length}>
                <ExpandableRowContent>
                  <RolesTable group={group} />
                </ExpandableRowContent>
              </Td>
            </Tr>

            {/* Expanded row for members */}
            <Tr isExpanded={isRowExpanded && expandedCellKey === 'members'}>
              <Td dataLabel="Members" noPadding colSpan={allColumns.length}>
                <ExpandableRowContent>
                  <MembersTable group={group} />
                </ExpandableRowContent>
              </Td>
            </Tr>
          </Tbody>
        );
      })}
    </Table>
  );
};
