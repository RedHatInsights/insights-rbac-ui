import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useDataViewSelection, useDataViewPagination } from '@patternfly/react-data-view/dist/dynamic/Hooks';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { DataView } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import { DataViewEventsProvider, EventTypes, useDataViewEventsContext } from '@patternfly/react-data-view/dist/dynamic/DataViewEventsContext';
import { Drawer, DrawerContent, DrawerContentBody, PageSection, Pagination } from '@patternfly/react-core';
import { ActionsColumn } from '@patternfly/react-table';
import ContentHeader from '@patternfly/react-component-groups/dist/esm/ContentHeader';
import { fetchRolesWithPolicies } from '../../redux/actions/role-actions';
import { useIntl } from 'react-intl';
import messages from '../../Messages';
import { mappedProps } from '../../helpers/shared/helpers';
import { Role } from '../../redux/reducers/role-reducer';
import { RBACStore } from '../../redux/store';
import { useSearchParams } from 'react-router-dom';

import RolesDetails from './RolesTableDetails';

const ROW_ACTIONS = [
  { title: 'Edit role', onClick: () => console.log('Editing role') },
  { title: 'Delete role', onClick: () => console.log('Removing role') },
];

const PER_PAGE = [
  { title: '5', value: 5 },
  { title: '10', value: 10 },
  { title: '20', value: 20 },
  { title: '50', value: 50 },
  { title: '100', value: 100 },
];

const ouiaId = 'RolesTable';

interface RolesTableProps {
  selectedRole?: Role;
}

const RolesTable: React.FunctionComponent<RolesTableProps> = ({ selectedRole = undefined }) => {
  const { roles, totalCount } = useSelector((state: RBACStore) => ({
    roles: state.roleReducer.roles.data || [],
    totalCount: state.roleReducer.roles.meta.count,
  }));

  const { trigger } = useDataViewEventsContext();

  const intl = useIntl();

  const COLUMNS: string[] = [
    intl.formatMessage(messages.name),
    intl.formatMessage(messages.description),
    intl.formatMessage(messages.permissions),
    intl.formatMessage(messages.workspaces),
    intl.formatMessage(messages.userGroups),
    intl.formatMessage(messages.lastModified),
  ];

  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const pagination = useDataViewPagination({ perPage: 20, searchParams, setSearchParams });
  const { page, perPage, onSetPage, onPerPageSelect } = pagination;

  const selection = useDataViewSelection({ matchOption: (a, b) => a[0] === b[0] });
  const { selected, onSelect, isSelected } = selection;

  const fetchData = useCallback(
    (apiProps: { count: number; limit: number; offset: number; orderBy: string }) => {
      const { count, limit, offset, orderBy } = apiProps;
      dispatch(fetchRolesWithPolicies({ ...mappedProps({ count, limit, offset, orderBy }) }));
    },
    [dispatch]
  );

  useEffect(() => {
    fetchData({
      limit: perPage,
      offset: (page - 1) * perPage,
      orderBy: 'display_name',
      count: totalCount || 0,
    });
  }, [fetchData, page, perPage]);

  const handleRowClick = (role: Role | undefined) => {
    trigger(EventTypes.rowClick, role);
  };

  const rows = roles.map((role) => ({
    row: Object.values({
      display_name: role.display_name,
      description: role.description,
      permissions: role.accessCount,
      workspaces: '',
      user_groups: '',
      last_modified: role.modified,
      rowActions: { cell: <ActionsColumn items={ROW_ACTIONS} />, props: { isActionCell: true } },
    }),
    props: {
      isClickable: true,
      onRowClick: () => handleRowClick(selectedRole?.display_name === role.display_name ? undefined : role),
      isRowSelected: selectedRole?.name === role.name,
    },
  }));

  const handleBulkSelect = (value: BulkSelectValue) => {
    value === BulkSelectValue.none && onSelect(false);
    value === BulkSelectValue.all && onSelect(true, roles);
    value === BulkSelectValue.nonePage && onSelect(false, rows);
    value === BulkSelectValue.page && onSelect(true, rows);
  };

  const pageSelected = rows.length > 0 && rows.every(isSelected);
  const pagePartiallySelected = !pageSelected && rows.some(isSelected);

  return (
    <React.Fragment>
      <ContentHeader title="Roles" subtitle={''} />
      <PageSection isWidthLimited>
        <DataView ouiaId={ouiaId} selection={selection}>
          <DataViewToolbar
            ouiaId={`${ouiaId}-header-toolbar`}
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
          <DataViewTable columns={COLUMNS} rows={rows} ouiaId={`${ouiaId}-table`} />
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
