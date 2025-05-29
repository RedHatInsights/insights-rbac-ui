import React, { Fragment, Suspense, lazy, useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import SkeletonTable from '@patternfly/react-component-groups/dist/dynamic/SkeletonTable';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { fetchRoleForPrincipal, fetchRoles } from '../../redux/actions/role-actions';
import messages from '../../Messages';

const ResourceDefinitionsModal = lazy(() => import('./ResourceDefinitionsModal'));

import { TableVariant, cellWidth, compoundExpand, sortable } from '@patternfly/react-table';
import { Table, TableBody, TableHeader } from '@patternfly/react-table/deprecated';
import ResourceDefinitionsLink from '../../presentational-components/myUserAccess/ResourceDefinitionsLink';

const MUARolesTable = ({ filters, setFilters, apps, showResourceDefinitions }) => {
  const intl = useIntl();
  const [expanded, setExpanded] = useState({});
  const [{ rdOpen, rdPermission, resourceDefinitions }, setRdConfig] = useState({ rdOpen: false });

  const columns = [
    {
      title: intl.formatMessage(messages.roles),
      key: 'display_name',
      transforms: [sortable],
    },
    { title: intl.formatMessage(messages.description) },
    {
      title: intl.formatMessage(messages.permissions),
      cellTransforms: [compoundExpand, cellWidth(20)],
    },
  ];

  const compoundPermissionsCells = [
    intl.formatMessage(messages.application),
    intl.formatMessage(messages.resourceType),
    intl.formatMessage(messages.operation),
    ...(showResourceDefinitions ? [intl.formatMessage(messages.resourceDefinitions)] : []),
  ];

  const { roles, isLoading, rolesWithAccess } = useSelector(
    ({ roleReducer: { roles, isLoading, rolesWithAccess } }) => ({
      roles,
      isLoading,
      rolesWithAccess,
    }),
    shallowEqual,
  );

  const [sortByState, setSortByState] = useState({ index: 0, direction: 'asc' });
  const orderBy = `${sortByState?.direction === 'desc' ? '-' : ''}${columns[sortByState?.index].key}`;
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchRoles({ limit: 20, offset: 0, orderBy, scope: 'principal', application: apps.join(',') }));
  }, []);

  const createRows = (data) => {
    return data?.reduce(
      (acc, { uuid, display_name, name, description, accessCount }, i) => [
        ...acc,
        {
          uuid,
          cells: [
            { title: display_name || name, props: { component: 'th', isOpen: false } },
            { title: description, props: { isOpen: false } },
            { title: accessCount, props: { isOpen: expanded[uuid] === 2 } },
          ],
        },
        {
          uuid: `${uuid}-groups`,
          parent: 2 * i,
          compoundParent: 2,
          cells: [
            {
              props: { colSpan: 4, className: 'pf-m-no-padding' },
              title: rolesWithAccess?.[uuid] ? (
                <Table
                  ouiaId="permissions-in-role-nested-table"
                  aria-label="Simple Table"
                  borders={false}
                  variant={TableVariant.compact}
                  cells={compoundPermissionsCells}
                  rows={rolesWithAccess[uuid].access.map((access) => ({
                    cells: [
                      ...access.permission.split(':'),
                      ...(showResourceDefinitions
                        ? [
                            <Fragment key="rd">
                              <ResourceDefinitionsLink
                                onClick={() =>
                                  setRdConfig({
                                    rdOpen: true,
                                    rdPermission: access.permission,
                                    resourceDefinitions: access.resourceDefinitions,
                                  })
                                }
                                access={access}
                              />
                            </Fragment>,
                          ]
                        : []),
                    ],
                  }))}
                >
                  <TableHeader />
                  <TableBody />
                </Table>
              ) : (
                <SkeletonTable columns={compoundPermissionsCells} rows={accessCount} variant={TableVariant.compact} />
              ),
            },
          ],
        },
      ],
      [],
    );
  };

  let debouncedFetch = useCallback(
    debounce((limit, offset, name, application, permission, orderBy) => {
      const applicationParam = application?.length > 0 ? application : apps;
      return dispatch(fetchRoles({ limit, offset, scope: 'principal', orderBy, name, application: applicationParam.join(','), permission }));
    }, 800),
    [],
  );

  const onExpand = (_event, _rowIndex, colIndex, isOpen, rowData) => {
    if (!isOpen) {
      setExpanded((expanded) => ({ ...expanded, [rowData.uuid]: colIndex }));
      // Permissions
      if (colIndex === 2) {
        dispatch(fetchRoleForPrincipal(rowData.uuid));
      }
    } else {
      setExpanded((expanded) => ({ ...expanded, [rowData.uuid]: -1 }));
    }
  };

  return (
    <Fragment>
      <TableToolbarView
        filters={filters}
        columns={columns}
        rows={createRows(roles.data)}
        data={roles.data}
        isCompact={false}
        isExpandable={true}
        onExpand={onExpand}
        ouiaId="roles-table"
        fetchData={({ limit, offset, name, application, permission }) => {
          debouncedFetch(limit, offset, name, application, permission, orderBy);
        }}
        sortBy={sortByState}
        onSort={(e, index, direction) => {
          const orderBy = `${direction === 'desc' ? '-' : ''}${columns[index].key}`;
          setSortByState({ index, direction });
          dispatch(
            fetchRoles({
              offset: 0,
              orderBy,
              ...(filters?.length > 0
                ? {
                    ...filters.reduce(
                      (acc, curr) => ({
                        ...acc,
                        [curr.key]: curr.value,
                      }),
                      {},
                    ),
                  }
                : { name: '', application: [] }),
            }),
          );
        }}
        emptyFilters={{ name: '', application: [] }}
        setFilterValue={setFilters}
        isLoading={isLoading}
        pagination={roles.meta}
        filterPlaceholder="role name"
        titlePlural="roles"
        titleSingular="role"
        tableId="mua-roles"
      />
      <Suspense fallback={<Fragment />}>
        {rdOpen && (
          <ResourceDefinitionsModal
            resourceDefinitions={resourceDefinitions}
            isOpen={rdOpen}
            handleClose={() => setRdConfig({ rdOpen: false })}
            permission={rdPermission}
          />
        )}
      </Suspense>
    </Fragment>
  );
};

MUARolesTable.propTypes = {
  fetchRoles: PropTypes.func,
  fetchRoleForPrincipal: PropTypes.func,
  fetchUsers: PropTypes.func,
  roles: PropTypes.object,
  isLoading: PropTypes.bool,
  rolesWithAccess: PropTypes.object,
  filters: PropTypes.arrayOf(PropTypes.object).isRequired,
  setFilters: PropTypes.func.isRequired,
  apps: PropTypes.arrayOf(PropTypes.string).isRequired,
  showResourceDefinitions: PropTypes.bool,
};

export default MUARolesTable;
