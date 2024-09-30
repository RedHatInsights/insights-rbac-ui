import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useDataViewSelection, useDataViewPagination } from '@patternfly/react-data-view/dist/dynamic/Hooks';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { DataView } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import { PageSection, Pagination } from '@patternfly/react-core';
import { ActionsColumn } from '@patternfly/react-table';
import ContentHeader from '@patternfly/react-component-groups/dist/esm/ContentHeader';
import { fetchRoles } from '../../redux/actions/role-actions';
import { useIntl } from 'react-intl';
import messages from '../../Messages';
import { mappedProps } from '../../helpers/shared/helpers';
import { Role } from '../../redux/reducers/role-reducer';
import { RBACStore } from '../../redux/store';

const intl = useIntl();

const COLUMNS = [
  intl.formatMessage(messages.name),
  intl.formatMessage(messages.description),
  intl.formatMessage(messages.permissions),
  intl.formatMessage(messages.workspaces),
  intl.formatMessage(messages.userGroups),
  intl.formatMessage(messages.lastModified),
];

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

// interface Role {
//   name: string;
//   description: string;
//   permissions: string;
//   workspaces: string[];
//   userGroup: string;
//   lastModified: string;
// }

// const mockRoles: Role[] = [
//   { name: 'one', description: 'yup', permissions: 'yah', workspaces: ['ok', 'great'], userGroup: 'group1', lastModified: 'today' },
//   { name: 'two', description: 'yup', permissions: 'yah', workspaces: ['ok', 'great'], userGroup: 'group2', lastModified: 'today' },
//   { name: 'three', description: 'yup', permissions: 'yah', workspaces: ['ok', 'great'], userGroup: 'group3', lastModified: 'today' },
//   { name: 'four', description: 'yup', permissions: 'yah', workspaces: ['ok', 'great'], userGroup: 'group4', lastModified: 'today' },
// ];

const ouiaId = 'RolesTable';

const RolesTable: React.FunctionComponent = () => {
  // const [roles, setRoles] = useState(mockRoles);
  const { isLoading, roles } = useSelector((state: RBACStore) => state.roleReducer);
  // const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const dispatch = useDispatch();

  const pagination = useDataViewPagination({ perPage: 20 });
  const { page, perPage } = pagination;

  const selection = useDataViewSelection({ matchOption: (a, b) => a === b });
  const { selected, onSelect, isSelected } = selection;

  const fetchData = useCallback(
    (apiProps: { limit: number; offset: number; orderBy: string }) => {
      const { limit, offset, orderBy } = apiProps;
      dispatch(fetchRoles({ ...mappedProps({ limit, offset, orderBy }), usesMetaInURL: true }));
    },
    [dispatch]
  );

  useEffect(() => {
    fetchData({
      limit: perPage,
      offset: (page - 1) * perPage,
      orderBy: 'display_name',
    });
  }, [fetchData, page, perPage]);

  const rows = roles.data.map((role: Role) => [
    role.display_name,
    role.description,
    '',
    '',
    '',
    role.modified,
    { cell: <ActionsColumn items={ROW_ACTIONS} />, props: { isActionCell: true } },
  ]);

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
        <DataView ouiaId={ouiaId}>
          <DataViewToolbar
            ouiaId={`${ouiaId}-header`}
            bulkSelect={
              <BulkSelect
                isDataPaginated
                canSelectAll
                pageCount={roles.data.length}
                totalCount={roles.data.length}
                selectedCount={selected.length}
                pageSelected={pageSelected}
                pagePartiallySelected={pagePartiallySelected}
                onSelect={handleBulkSelect}
              />
            }
            pagination={<Pagination perPageOptions={PER_PAGE} itemCount={roles.data.length} {...pagination} />}
          />
          <DataViewTable columns={COLUMNS} rows={rows} />
          <DataViewToolbar pagination={<Pagination perPageOptions={PER_PAGE} itemCount={roles.data.length} {...pagination} />} />
        </DataView>
      </PageSection>
    </React.Fragment>
  );
};

export default RolesTable;
