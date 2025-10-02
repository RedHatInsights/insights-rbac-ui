import React, { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { DataView, DataViewState } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import { DataViewEventsProvider, EventTypes, useDataViewEventsContext } from '@patternfly/react-data-view/dist/dynamic/DataViewEventsContext';
import { ButtonVariant } from '@patternfly/react-core';
import { Drawer } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerContent } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerContentBody } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Pagination } from '@patternfly/react-core/dist/dynamic/components/Pagination';
import { ActionsColumn } from '@patternfly/react-table';
import { TableVariant } from '@patternfly/react-table';
import { ThProps } from '@patternfly/react-table';
import ContentHeader from '@patternfly/react-component-groups/dist/esm/ContentHeader';
import { removeRole } from '../../redux/roles/actions';
import { FormattedMessage, useIntl } from 'react-intl';
import messages from '../../Messages';
import { Role } from '../../redux/roles/reducer';
import { Outlet } from 'react-router-dom';
import paths from '../../utilities/pathnames';
import RolesDetails from './RolesTableDetails';
import {
  ResponsiveAction,
  ResponsiveActions,
  SkeletonTable,
  SkeletonTableBody,
  SkeletonTableHead,
  WarningModal,
} from '@patternfly/react-component-groups';
import { DataViewTextFilter, DataViewTh, DataViewTr, DataViewTrObject } from '@patternfly/react-data-view';
import { PER_PAGE_OPTIONS } from '../../helpers/pagination';
import pathnames from '../../utilities/pathnames';
import useAppNavigate from '../../hooks/useAppNavigate';
import { useRoles } from './useRoles';
import { RolesEmptyState } from './components/RolesEmptyState';

const ouiaId = 'RolesTable';

interface RolesTableProps {
  selectedRole?: Role;
}

const RolesTable: React.FunctionComponent<RolesTableProps> = ({ selectedRole }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentRoles, setCurrentRoles] = useState<Role[]>([]);

  // Use the custom hook for all Roles business logic
  const {
    roles,
    isLoading,
    totalCount,
    filters,
    sortBy,
    direction,
    onSort,
    pagination,
    selection,

    handleRowClick: hookHandleRowClick,
    clearAllFilters,
    onSetFilters,
  } = useRoles({ enableAdminFeatures: true });

  const { trigger } = useDataViewEventsContext();

  const intl = useIntl();
  const dispatch = useDispatch();

  const handleModalToggle = (roles: Role[]) => {
    setCurrentRoles(roles);
    setIsDeleteModalOpen(!isDeleteModalOpen);
  };

  const COLUMNHEADERS = [
    { label: intl.formatMessage(messages.name), key: 'display_name', index: 0, isSortable: true },
    { label: intl.formatMessage(messages.description), key: 'description', index: 1, isSortable: false },
    { label: intl.formatMessage(messages.permissions), key: 'accessCount', index: 2, isSortable: false },
    { label: intl.formatMessage(messages.workspaces), key: 'workspaces', index: 3, isSortable: false },
    { label: intl.formatMessage(messages.userGroups), key: 'user_groups', index: 4, isSortable: false },
    { label: intl.formatMessage(messages.lastModified), key: 'modified', index: 5, isSortable: true },
  ];

  const navigate = useAppNavigate();
  const { page, perPage, onSetPage, onPerPageSelect } = pagination;
  const { selected, onSelect, isSelected } = selection;

  // Note: Data fetching and state management is now handled by the useRoles hook automatically

  const handleEditRole = useCallback(
    (role: Role) => {
      if (!role) {
        return;
      }
      navigate(paths['edit-role'].path.replace(':roleId', role.uuid));
    },
    [navigate],
  );

  const sortByIndex = useMemo(() => COLUMNHEADERS.findIndex((item) => (item.isSortable ? item.key === sortBy : '')), [sortBy]);

  const getSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: sortByIndex,
      direction,
      defaultDirection: 'asc',
    },
    onSort: (_event, index, direction) => {
      onSort(_event, COLUMNHEADERS[index].key, direction);
      onSetPage(undefined, 1);
    },
    columnIndex,
  });

  const columns: DataViewTh[] = COLUMNHEADERS.map((column, index) => ({
    cell: column.label,
    props: column.isSortable ? { sort: getSortParams(index) } : {},
  }));

  const rows: DataViewTr[] = useMemo(() => {
    const handleRowClick = (event: any, role: Role | undefined) => {
      (event.target.matches('td') || event.target.matches('tr')) && trigger(EventTypes.rowClick, role);
      // Also use the hook's handler
      if (role) {
        hookHandleRowClick(role);
      }
    };

    return roles.map((role: Role) => ({
      id: role.uuid,
      row: Object.values({
        display_name: role.display_name,
        description: role.description,
        permissions: role.accessCount,
        workspaces: '',
        user_groups: '',
        last_modified: role.modified,
        rowActions: {
          cell: (
            <ActionsColumn
              items={[
                { title: 'Edit role', onClick: () => handleEditRole(role) },
                {
                  title: 'Delete role',
                  isDisabled: role.system,
                  onClick: () => handleModalToggle([role]),
                },
              ]}
            />
          ),
          props: { isActionCell: true },
        },
      }),
      props: {
        isClickable: true,
        onRowClick: (event: any) => handleRowClick(event, selectedRole?.uuid === role.uuid ? undefined : role),
        isRowSelected: selectedRole?.name === role.name,
      },
    }));
  }, [roles, handleModalToggle, trigger, selectedRole, hookHandleRowClick, handleEditRole]);

  const handleBulkSelect = (value: BulkSelectValue) => {
    value === BulkSelectValue.none && onSelect(false);
    value === BulkSelectValue.page && onSelect(true, rows);
    value === BulkSelectValue.nonePage && onSelect(false, rows);
  };

  const pageSelected = rows.length > 0 && rows.every(isSelected);
  const pagePartiallySelected = !pageSelected && rows.some(isSelected);

  const isRowSystemOrPlatformDefault = (selectedRow: any) => {
    const role = roles.find((role: Role) => role.uuid === selectedRow.id);
    return role?.platform_default || role?.system;
  };

  const activeState = isLoading ? DataViewState.loading : roles.length === 0 ? DataViewState.empty : undefined;

  return (
    <React.Fragment>
      <ContentHeader title="Roles" subtitle={''} />
      <PageSection isWidthLimited>
        {isDeleteModalOpen && (
          <WarningModal
            ouiaId={`${ouiaId}-remove-role-modal`}
            isOpen={isDeleteModalOpen}
            title={intl.formatMessage(messages.deleteCustomRoleModalHeader)}
            confirmButtonLabel={intl.formatMessage(messages.deleteRoleConfirm)}
            confirmButtonVariant={ButtonVariant.danger}
            withCheckbox
            checkboxLabel={intl.formatMessage(messages.understandActionIrreversible)}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={() => {
              currentRoles.forEach((role) => {
                dispatch(removeRole(role.uuid));
              });
              setIsDeleteModalOpen(false);
            }}
          >
            <FormattedMessage
              {...messages.deleteCustomRoleModalBody}
              values={{
                b: (text) => <b>{text}</b>,
                count: currentRoles.length,
                plural: currentRoles.length > 1 ? intl.formatMessage(messages.roles) : intl.formatMessage(messages.role),
                name: currentRoles[0]?.display_name,
              }}
            />
          </WarningModal>
        )}
        <DataView ouiaId={ouiaId} selection={selection} activeState={activeState}>
          <DataViewToolbar
            ouiaId={`${ouiaId}-header-toolbar`}
            clearAllFilters={clearAllFilters}
            bulkSelect={
              <BulkSelect
                isDataPaginated
                pageCount={roles.length}
                totalCount={totalCount}
                selectedCount={selected.length}
                pageSelected={pageSelected}
                pagePartiallySelected={pagePartiallySelected}
                onSelect={handleBulkSelect}
              />
            }
            actions={
              <ResponsiveActions breakpoint="lg" ouiaId={`${ouiaId}-actions-dropdown`}>
                <ResponsiveAction ouiaId="add-role-button" onClick={() => navigate(`roles/${paths['add-role'].path}`)} isPinned>
                  {intl.formatMessage(messages.createRole)}
                </ResponsiveAction>
                <ResponsiveAction
                  isDisabled={selected.length === 0 || selected.some(isRowSystemOrPlatformDefault)}
                  onClick={() => {
                    handleModalToggle(roles.filter((role: Role) => selected.some((selectedRow: DataViewTrObject) => selectedRow.id === role.uuid)));
                  }}
                >
                  {intl.formatMessage(messages.deleteRolesAction)}
                </ResponsiveAction>
              </ResponsiveActions>
            }
            pagination={
              <Pagination
                perPageOptions={PER_PAGE_OPTIONS}
                itemCount={totalCount}
                page={page}
                perPage={perPage}
                onSetPage={onSetPage}
                onPerPageSelect={onPerPageSelect}
              />
            }
            filters={
              <DataViewTextFilter
                filterId="display_name"
                title={intl.formatMessage(messages.name)}
                placeholder={intl.formatMessage(messages.nameFilterPlaceholder)}
                ouiaId={`${ouiaId}-name-filter`}
                onChange={(_e, value) => {
                  onSetFilters({ display_name: value });
                  onSetPage(undefined, 1);
                }}
                value={filters['display_name']}
              />
            }
          />
          {isLoading ? (
            <SkeletonTable rowsCount={10} columns={columns} variant={TableVariant.compact} />
          ) : (
            <DataViewTable
              columns={columns}
              rows={rows}
              ouiaId={`${ouiaId}-table`}
              headStates={{ loading: <SkeletonTableHead columns={columns} /> }}
              bodyStates={{
                loading: <SkeletonTableBody rowsCount={10} columnsCount={columns.length} />,
                empty: <RolesEmptyState />,
              }}
            />
          )}
          <DataViewToolbar
            ouiaId={`${ouiaId}-footer-toolbar`}
            pagination={
              <Pagination
                perPageOptions={PER_PAGE_OPTIONS}
                itemCount={totalCount}
                page={page}
                perPage={perPage}
                onSetPage={onSetPage}
                onPerPageSelect={onPerPageSelect}
              />
            }
          />
        </DataView>
        <Suspense>
          <Outlet
            context={{
              [pathnames['add-role'].path]: {
                pagination,
                filters: { display_name: filters.display_name },
              },
            }}
          />
        </Suspense>
      </PageSection>
    </React.Fragment>
  );
};

export const RolesPage: React.FunctionComponent = () => {
  const [selectedRole, setSelectedRole] = useState<Role>();
  const drawerRef = useRef<HTMLDivElement>(null);

  return (
    <DataViewEventsProvider>
      <Drawer isExpanded={Boolean(selectedRole)} onExpand={() => drawerRef.current?.focus()} data-ouia-component-id={`${ouiaId}-detail-drawer`}>
        <DrawerContent panelContent={<RolesDetails selectedRole={selectedRole} setSelectedRole={setSelectedRole} />}>
          <DrawerContentBody>
            <RolesTable selectedRole={selectedRole} />
          </DrawerContentBody>
        </DrawerContent>
      </Drawer>
    </DataViewEventsProvider>
  );
};

export default RolesPage;
