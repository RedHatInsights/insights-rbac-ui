import React, { useState } from 'react';
import { Table } from '@patternfly/react-table/dist/dynamic/components/Table';
import { TableVariant } from '@patternfly/react-table';
import { Thead } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Tbody } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Tr } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Th } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Td } from '@patternfly/react-table/dist/dynamic/components/Table';
import { ExpandableRowContent } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Dropdown } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { DropdownList } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { DropdownItem } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { MenuToggle } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import EllipsisVIcon from '@patternfly/react-icons/dist/js/icons/ellipsis-v-icon';
import { useIntl } from 'react-intl';
import { DateFormat } from '@redhat-cloud-services/frontend-components/DateFormat';
import { getDateFormat } from '../../../helpers/stringUtilities';
import { AppLink } from '../../../components/navigation/AppLink';
import messages from '../../../Messages';
import pathnames from '../../../utilities/pathnames';
import type { Access, AdditionalGroup, RoleOutDynamic } from '@redhat-cloud-services/rbac-client/types';
import type { GroupOut } from '../../../data/queries/groups';

// Type aliases for backwards compatibility
type Role = RoleOutDynamic;
type RoleGroup = AdditionalGroup;
type Group = GroupOut;
import type { ExpandedCells, SortByState } from '../types';
import { shouldShowAddRoleToGroupLink } from '../utils/roleVisibility';

interface RolesTableProps {
  roles: Role[];
  isAdmin: boolean;
  isSelectable: boolean;
  selectedRows: Array<{ uuid: string; label: string }>;
  expandedCells: ExpandedCells;
  sortByState: SortByState;
  onRowSelection: (rows: Array<{ uuid: string; label: string }>) => void;
  onExpansion: (roleUuid: string, columnKey: 'groups' | 'permissions', isExpanding: boolean) => void;
  onSort: (event: React.MouseEvent, index: number, direction: 'asc' | 'desc') => void;
  onEditRole: (roleId: string) => void;
  onDeleteRole: (roleIds: string[]) => void;
  adminGroup: Group | undefined;
}

// Nested table for groups
const GroupsTable: React.FC<{ role: Role; adminGroup: Group | undefined }> = ({ role, adminGroup }) => {
  const intl = useIntl();

  const groupColumns = [intl.formatMessage(messages.groupName), intl.formatMessage(messages.description)];

  return (
    <Table aria-label={`Groups for role ${role.display_name}`} variant={TableVariant.compact} ouiaId={`compound-groups-${role.uuid}`}>
      <Thead>
        <Tr>
          {groupColumns.map((col, index) => (
            <Th key={index}>{col}</Th>
          ))}
          <Th screenReaderText="Actions" />
        </Tr>
      </Thead>
      <Tbody>
        {role.groups_in && role.groups_in.length > 0 ? (
          role.groups_in.map((group: RoleGroup, index: number) => (
            <Tr key={`${role.uuid}-group-${group.uuid ?? index}`}>
              <Td dataLabel={groupColumns[0]}>
                {group.uuid ? <AppLink to={pathnames['group-detail'].link(group.uuid)}>{group.name}</AppLink> : group.name}
              </Td>
              <Td dataLabel={groupColumns[1]}>{group.description}</Td>
              <Td className="pf-v6-u-text-align-right">
                {shouldShowAddRoleToGroupLink(adminGroup, group) && group.uuid && (
                  <AppLink to={pathnames['roles-add-group-roles'].link(role.uuid, group.uuid)} state={{ name: group.name }}>
                    {intl.formatMessage(messages.addRoleToThisGroup)}
                  </AppLink>
                )}
              </Td>
            </Tr>
          ))
        ) : (
          <Tr>
            <Td colSpan={groupColumns.length}>
              <Content component="p" className="pf-v6-u-mx-lg pf-v6-u-my-sm">
                {intl.formatMessage(messages.noGroups)}
              </Content>
            </Td>
          </Tr>
        )}
      </Tbody>
    </Table>
  );
};

// Nested table for permissions
const PermissionsTable: React.FC<{ role: Role }> = ({ role }) => {
  const intl = useIntl();

  const permissionColumns = [
    intl.formatMessage(messages.application),
    intl.formatMessage(messages.resourceType),
    intl.formatMessage(messages.operation),
    intl.formatMessage(messages.lastModified),
  ];

  return (
    <Table aria-label={`Permissions for role ${role.display_name}`} variant={TableVariant.compact} ouiaId={`compound-permissions-${role.uuid}`}>
      <Thead>
        <Tr>
          {permissionColumns.map((col, index) => (
            <Th key={index}>{col}</Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {role.access && role.access.length > 0 ? (
          role.access.map((access: Access, index: number) => {
            const [appName, type, operation] = access.permission.split(':');
            return (
              <Tr key={`${role.uuid}-permission-${index}`}>
                <Td dataLabel={permissionColumns[0]}>{appName}</Td>
                <Td dataLabel={permissionColumns[1]}>{type}</Td>
                <Td dataLabel={permissionColumns[2]}>{operation}</Td>
                <Td dataLabel={permissionColumns[3]}>
                  <DateFormat date={role.modified} type={getDateFormat(role.modified)} />
                </Td>
              </Tr>
            );
          })
        ) : (
          <Tr>
            <Td colSpan={permissionColumns.length}>
              <Content component="p" className="pf-v6-u-mx-lg pf-v6-u-my-sm">
                {intl.formatMessage(messages.noPermissions)}
              </Content>
            </Td>
          </Tr>
        )}
      </Tbody>
    </Table>
  );
};

// Row actions dropdown
const RoleRowActions: React.FC<{
  role: Role;
  onEditRole: (roleId: string) => void;
  onDeleteRole: (roleIds: string[]) => void;
}> = ({ role, onEditRole, onDeleteRole }) => {
  const intl = useIntl();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      toggle={(toggleRef) => (
        <MenuToggle ref={toggleRef} aria-label={`Actions for role ${role.display_name}`} variant="plain" onClick={() => setIsOpen(!isOpen)}>
          <EllipsisVIcon />
        </MenuToggle>
      )}
    >
      <DropdownList>
        <DropdownItem onClick={() => onEditRole(role.uuid)}>{intl.formatMessage(messages.edit)}</DropdownItem>
        <DropdownItem onClick={() => onDeleteRole([role.uuid])}>{intl.formatMessage(messages.delete)}</DropdownItem>
      </DropdownList>
    </Dropdown>
  );
};

export const RolesTable: React.FC<RolesTableProps> = ({
  roles,
  isAdmin,
  isSelectable,
  selectedRows,
  expandedCells,
  sortByState,
  onRowSelection,
  onExpansion,
  onSort,
  onEditRole,
  onDeleteRole,
  adminGroup,
}) => {
  const intl = useIntl();

  const columns: Array<{ title: string; key: string }> = [
    { title: intl.formatMessage(messages.name), key: 'display_name' },
    { title: intl.formatMessage(messages.description), key: '' },
    { title: intl.formatMessage(messages.groups), key: '' },
    { title: intl.formatMessage(messages.permissions), key: '' },
    { title: intl.formatMessage(messages.lastModified), key: 'modified' },
  ];

  // Add selection and actions columns for admin users
  const allColumns = isAdmin ? [{ title: '', key: 'selection' }, ...columns, { title: '', key: 'actions' }] : columns;

  const handleRowSelect = (role: Role, isChecking: boolean) => {
    if (isChecking) {
      onRowSelection([...selectedRows, { uuid: role.uuid, label: role.name }]);
    } else {
      onRowSelection(selectedRows.filter((row) => row.uuid !== role.uuid));
    }
  };

  const isRowSelected = (role: Role) => {
    return selectedRows.some((row) => row.uuid === role.uuid);
  };

  const isRowSelectable = (role: Role) => {
    return !(role.platform_default || role.admin_default || role.system);
  };

  const compoundExpandParams = (role: Role, columnKey: 'groups' | 'permissions', rowIndex: number, columnIndex: number) => ({
    isExpanded: expandedCells[role.uuid] === columnKey,
    onToggle: () => onExpansion(role.uuid, columnKey, expandedCells[role.uuid] !== columnKey),
    expandId: `compound-${columnKey}-${role.uuid}`,
    rowIndex,
    columnIndex,
  });

  const getSortParams = (columnIndex: number) => ({
    sort: {
      sortBy: {
        index: sortByState.index,
        direction: sortByState.direction,
      },
      onSort,
      columnIndex,
    },
  });

  return (
    <Table isExpandable aria-label={intl.formatMessage(messages.roles)}>
      <Thead>
        <Tr>
          {isAdmin && <Th screenReaderText="Row selection" />}
          <Th {...getSortParams(Number(isSelectable))}>{columns[0].title}</Th>
          <Th>{columns[1].title}</Th>
          <Th>{columns[2].title}</Th>
          <Th>{columns[3].title}</Th>
          <Th {...getSortParams(Number(isSelectable) + 4)}>{columns[4].title}</Th>
          {isAdmin && <Th screenReaderText="Row actions" />}
        </Tr>
      </Thead>

      {roles.map((role, rowIndex) => {
        const expandedCellKey = expandedCells[role.uuid];
        const isRowExpanded = !!expandedCellKey;
        const isSelected = isRowSelected(role);
        const isSelectable = isRowSelectable(role);

        return (
          <Tbody key={role.uuid} isExpanded={isRowExpanded}>
            <Tr>
              {isAdmin && (
                <Td
                  select={{
                    rowIndex,
                    onSelect: (_event, isSelecting) => handleRowSelect(role, isSelecting),
                    isSelected,
                    isDisabled: !isSelectable,
                  }}
                />
              )}

              <Td dataLabel={columns[0].title}>
                <AppLink to={pathnames['role-detail'].link(role.uuid)}>{role.display_name || role.name}</AppLink>
              </Td>

              <Td dataLabel={columns[1].title}>{role.description}</Td>

              <Td dataLabel={columns[2].title} compoundExpand={compoundExpandParams(role, 'groups', rowIndex, 2)}>
                {role.groups_in_count}
              </Td>

              <Td dataLabel={columns[3].title} compoundExpand={compoundExpandParams(role, 'permissions', rowIndex, 3)}>
                {role.accessCount}
              </Td>

              <Td dataLabel={columns[4].title}>
                <DateFormat date={role.modified} type={getDateFormat(role.modified)} />
              </Td>

              {isAdmin && (
                <Td className="pf-v6-c-table__action">
                  <RoleRowActions role={role} onEditRole={onEditRole} onDeleteRole={onDeleteRole} />
                </Td>
              )}
            </Tr>

            {/* Expanded row for groups */}
            <Tr isExpanded={isRowExpanded && expandedCellKey === 'groups'}>
              <Td dataLabel="Groups" noPadding colSpan={allColumns.length}>
                <ExpandableRowContent>
                  <GroupsTable role={role} adminGroup={adminGroup} />
                </ExpandableRowContent>
              </Td>
            </Tr>

            {/* Expanded row for permissions */}
            <Tr isExpanded={isRowExpanded && expandedCellKey === 'permissions'}>
              <Td dataLabel="Permissions" noPadding colSpan={allColumns.length}>
                <ExpandableRowContent>
                  <PermissionsTable role={role} />
                </ExpandableRowContent>
              </Td>
            </Tr>
          </Tbody>
        );
      })}
    </Table>
  );
};
