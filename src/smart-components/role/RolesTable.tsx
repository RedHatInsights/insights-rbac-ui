import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useDataViewSelection, useDataViewPagination } from '@patternfly/react-data-view/dist/dynamic/Hooks';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { DataView } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import { DataViewEventsProvider, EventTypes, useDataViewEventsContext } from '@patternfly/react-data-view/dist/dynamic/DataViewEventsContext';
import { useDataViewSort } from '@patternfly/react-data-view/dist/dynamic/Hooks';
import { ButtonVariant, Drawer, DrawerContent, DrawerContentBody, PageSection, Pagination } from '@patternfly/react-core';
import { ActionsColumn, ThProps } from '@patternfly/react-table';
import ContentHeader from '@patternfly/react-component-groups/dist/esm/ContentHeader';
import { fetchRolesWithPolicies, removeRole } from '../../redux/actions/role-actions';
import { FormattedMessage, useIntl } from 'react-intl';
import messages from '../../Messages';
import { mappedProps } from '../../helpers/shared/helpers';
import { Role } from '../../redux/reducers/role-reducer';
import { RBACStore } from '../../redux/store';
import { useSearchParams } from 'react-router-dom';
import RolesDetails from './RolesTableDetails';
import { ResponsiveAction, ResponsiveActions, WarningModal } from '@patternfly/react-component-groups';
import { DataViewTextFilter, DataViewTh, DataViewTr, DataViewTrObject, useDataViewFilters } from '@patternfly/react-data-view';

const PER_PAGE = [
  { title: '5', value: 5 },
  { title: '10', value: 10 },
  { title: '20', value: 20 },
  { title: '50', value: 50 },
  { title: '100', value: 100 },
];

interface RoleFilters {
  display_name: string;
}

const ouiaId = 'RolesTable';

interface RolesTableProps {
  selectedRole?: Role;
}

const RolesTable: React.FunctionComponent<RolesTableProps> = ({ selectedRole }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentRoles, setCurrentRoles] = useState<Role[]>([]);
  const { roles, totalCount } = useSelector((state: RBACStore) => ({
    roles: state.roleReducer.roles.data || [],
    totalCount: state.roleReducer.roles.meta.count,
  }));

  const { trigger } = useDataViewEventsContext();

  const intl = useIntl();

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

  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<RoleFilters>({
    initialFilters: { display_name: '' },
    searchParams,
    setSearchParams,
  });

  const { sortBy, direction, onSort } = useDataViewSort({ searchParams, setSearchParams });
  const sortByIndex = useMemo(() => COLUMNHEADERS.findIndex((item) => (item.isSortable ? item.key === sortBy : '')), [sortBy]);

  const pagination = useDataViewPagination({ perPage: 20, searchParams, setSearchParams });
  const { page, perPage, onSetPage, onPerPageSelect } = pagination;

  const selection = useDataViewSelection({ matchOption: (a, b) => a.id === b.id });
  const { selected, onSelect, isSelected } = selection;

  const fetchData = useCallback(
    (apiProps: { count: number; limit: number; offset: number; orderBy: string; filters: RoleFilters }) => {
      const { count, limit, offset, orderBy, filters } = apiProps;
      dispatch(fetchRolesWithPolicies({ ...mappedProps({ count, limit, offset, orderBy, filters }) }));
    },
    [dispatch]
  );

  useEffect(() => {
    fetchData({
      limit: perPage,
      offset: (page - 1) * perPage,
      orderBy: `${direction === 'desc' ? '-' : ''}${sortBy}` || '',
      count: totalCount || 0,
      filters: filters,
    });
  }, [fetchData, page, perPage, filters, onSetFilters, sortBy, direction]);

  const getSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: sortByIndex,
      direction,
      defaultDirection: 'asc',
    },
    onSort: (_event, index, direction) => {
      onSetPage(_event, 1);
      onSort(_event, COLUMNHEADERS[index].key, direction);
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
                { title: 'Edit role', onClick: () => console.log('Editing role') },
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
  }, [roles, handleModalToggle, trigger, selectedRole, selectedRole?.display_name, sortBy, onSort, direction, filters, onSetFilters]);

  const handleBulkSelect = (value: BulkSelectValue) => {
    value === BulkSelectValue.none && onSelect(false);
    value === BulkSelectValue.all && onSelect(true, roles);
    value === BulkSelectValue.nonePage && onSelect(false, rows);
    value === BulkSelectValue.page && onSelect(true, rows);
  };

  const pageSelected = rows.length > 0 && rows.every(isSelected);
  const pagePartiallySelected = !pageSelected && rows.some(isSelected);

  const isRowSystemOrPlatformDefault = (selectedRow: any) => {
    const role = roles.find((role) => role.uuid === selectedRow.id);
    return role?.platform_default || role?.system;
  };

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
        <DataView ouiaId={ouiaId} selection={selection}>
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
                <ResponsiveAction
                  isDisabled={selected.length === 0 || selected.some(isRowSystemOrPlatformDefault)}
                  onClick={() => {
                    handleModalToggle(roles.filter((role) => selected.some((selectedRow: DataViewTrObject) => selectedRow.id === role.uuid)));
                  }}
                >
                  {intl.formatMessage(messages.deleteRolesAction)}
                </ResponsiveAction>
              </ResponsiveActions>
            }
            pagination={
              <Pagination
                perPageOptions={PER_PAGE}
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
                title="Name"
                placeholder="Filter by name"
                ouiaId={`${ouiaId}-name-filter`}
                onChange={(_e, value) => onSetFilters({ display_name: value })}
                value={filters['display_name']}
              />
            }
          />
          <DataViewTable columns={columns} rows={rows} ouiaId={`${ouiaId}-table`} />
          <DataViewToolbar
            ouiaId={`${ouiaId}-footer-toolbar`}
            pagination={
              <Pagination
                perPageOptions={PER_PAGE}
                itemCount={totalCount}
                page={page}
                perPage={perPage}
                onSetPage={onSetPage}
                onPerPageSelect={onPerPageSelect}
              />
            }
          />
        </DataView>
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
