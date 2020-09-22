import React, { Fragment, useCallback, useEffect, useState, lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import debounce from 'lodash/debounce';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';
import { fetchRoles, fetchRoleForPrincipal } from '../../redux/actions/role-actions';
import { ListLoader } from '../../presentational-components/shared/loader-placeholders';

const ResourceDefinitionsModal = lazy(() => import('./ResourceDefinitionsModal'));

import { Table, TableHeader, TableBody, TableVariant, compoundExpand, cellWidth } from '@patternfly/react-table';
import ResourceDefinitionsButton from '../../presentational-components/myUserAccess/ResourceDefinitionsButton';

const columns = [
  'Roles',
  'Description',
  {
    title: 'Permissions',
    cellTransforms: [compoundExpand, cellWidth(20)],
  },
];

const MUARolesTable = ({
  fetchRoles,
  fetchRoleForPrincipal,
  roles,
  isLoading,
  rolesWithAccess,
  filters,
  setFilters,
  apps,
  showResourceDefinitions,
}) => {
  const [expanded, setExpanded] = useState({});
  const [{ rdOpen, rdPermission, resourceDefinitions }, setRdConfig] = useState({ rdOpen: false });

  useEffect(() => {
    fetchRoles({ limit: 20, offset: 0, scope: 'principal', application: apps.join(',') });
  }, []);

  const createRows = (data) => {
    return data?.reduce(
      (acc, { uuid, name, description, accessCount }, i) => [
        ...acc,
        {
          uuid,
          cells: [
            { title: name, props: { component: 'th', isOpen: false } },
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
                  aria-label="Simple Table"
                  borders={false}
                  variant={TableVariant.compact}
                  cells={['Application', 'Resource type', 'Operation', ...(showResourceDefinitions ? ['Resource definitions'] : [])]}
                  rows={rolesWithAccess[uuid].access.map((access) => ({
                    cells: [
                      ...access.permission.split(':'),
                      ...(showResourceDefinitions
                        ? [
                            <Fragment key="rd">
                              <ResourceDefinitionsButton
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
                <ListLoader />
              ),
            },
          ],
        },
      ],
      []
    );
  };

  let debouncedFetch = useCallback(
    debounce((limit, offset, name, application, addFields) => {
      const applicationParam = application?.length > 0 ? application : apps;
      return fetchRoles({ limit, offset, name, application: applicationParam.join(','), addFields });
    }, 800),
    []
  );

  const onExpand = (_event, _rowIndex, colIndex, isOpen, rowData) => {
    if (!isOpen) {
      setExpanded((expanded) => ({ ...expanded, [rowData.uuid]: colIndex }));
      // Permissions
      if (colIndex === 2) {
        fetchRoleForPrincipal(rowData.uuid);
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
        isCompact={false}
        isExpandable={true}
        onExpand={onExpand}
        createRows={createRows}
        data={roles.data}
        fetchData={({ limit, offset, name, application }) => {
          debouncedFetch(limit, offset, name, application);
        }}
        setFilterValue={setFilters}
        isLoading={isLoading}
        pagination={roles.meta}
        filterPlaceholder="role name"
        titlePlural="roles"
        titleSingular="role"
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

const mapStateToProps = ({ roleReducer: { roles, isLoading, rolesWithAccess } }) => ({
  roles,
  isLoading,
  rolesWithAccess,
});
const mapDispatchToProps = (dispatch) => ({
  fetchRoles: (apiProps) => dispatch(fetchRoles(apiProps)),
  fetchRoleForPrincipal: (uuid) => dispatch(fetchRoleForPrincipal(uuid)),
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(MUARolesTable));
