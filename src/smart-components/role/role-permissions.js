import React, { useEffect, useReducer, useState } from 'react';
import { TextContent, Text, TextVariants } from '@patternfly/react-core';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';
import {
  createRows,
  INITIALIZE_ROLE,
  INITIATE_REMOVE_PERMISSION,
  rolePermissionsReducer,
  rolePermissionsReducerInitialState,
  SELECT_PERMISSIONS,
  SET_FILTERS,
  SET_PAGINATION,
  SET_TOGGLED,
  SHOW_REMOVE_MODAL,
  SUBMIT_REMOVE_MODAL,
} from './role-permissions-table-helpers';
import { cellWidth } from '@patternfly/react-table';
import './role-permissions.scss';
import RemovePermissionsModal from './remove-permissions-modal';
import { removeRolePermissions, fetchRole } from '../../redux/actions/role-actions';
import { Link, Route, useHistory } from 'react-router-dom';
import { Button } from '@patternfly/react-core';
import AddRolePermissionWizard from './add-role-permissions/add-role-permission-wizard';
import { routes as paths } from '../../../package.json';

const maxFilterItems = 10;

const columns = [
  { title: 'Application' },
  { title: 'Resource type' },
  { title: 'Operation' },
  {
    title: 'Resource definitions',
    header: {
      info: {
        popover: 'Resource definitions only apply to Cost Management permissions',
        ariaLabel: 'Resource definitions only apply to Cost Management permissions',
        popoverProps: {
          maxWidth: '19rem',
          minWidth: '19rem',
        },
      },
    },
    transforms: [cellWidth(20)],
  },
  { title: 'Last commit', transforms: [cellWidth(15)] },
];

const removeModalText = (permissions, role, plural) =>
  plural ? (
    <p>
      The <b> {`${permissions}`}</b> selected permissions will no longer be granted through the <b>{`${role.name}`}</b> role.
    </p>
  ) : (
    <p>
      The <b>{`${permissions}`}</b> permission will no longer be granted through the <b> {`${role.name}`}</b> role.
    </p>
  );

const Permissions = () => {
  const { role, isRecordLoading } = useSelector(
    (state) => ({
      role: state.roleReducer.selectedRole,
      isRecordLoading: state.roleReducer.isRecordLoading,
    }),
    shallowEqual
  );

  const history = useHistory();
  const [
    { pagination, selectedPermissions, showRemoveModal, confirmDelete, deleteInfo, filters, isToggled, resources, operations },
    internalDispatch,
  ] = useReducer(rolePermissionsReducer, rolePermissionsReducerInitialState);

  const [showResourceDefinitions, setShowResourceDefinitions] = useState(true);

  const dispatch = useDispatch();

  const setCheckedItems = (newSelection) => {
    internalDispatch({ type: SELECT_PERMISSIONS, selection: newSelection(selectedPermissions).map(({ uuid }) => ({ uuid })) });
  };

  useEffect(() => {
    if (Object.keys(role).length > 0) {
      const { resources, operations } = Object.entries(
        role.access.reduce(
          ({ resources, operations }, { permission }) => {
            const [, resource, operation] = permission.split(':');
            return {
              resources: resources.includes(resource) ? resources : [...resources, resource],
              operations: operations.includes(operation) ? operations : [...operations, operation],
            };
          },
          { resources: [], operations: [] }
        )
      ).reduce((acc, [key, value]) => ({ ...acc, [key]: value.map((item) => ({ label: item, value: item })) }), {});
      internalDispatch({ type: INITIALIZE_ROLE, resources, operations, count: role.access ? role.access.length : 0 });
    }

    setShowResourceDefinitions(role?.access?.find((a) => a.permission.includes('cost-management')));
  }, [role]);

  const filteredRows =
    role && role.access
      ? (role.access || [])
          .filter(({ permission }) => {
            const [application, resource, operation] = permission.split(':');
            const { applications, resources, operations } = filters;
            return (
              (applications.length > 0 ? applications.includes(application) : true) &&
              (resources.length > 0 ? resources.includes(resource) : true) &&
              (operations.length > 0 ? operations.includes(operation) : true)
            );
          })
          .map((acc) => ({ uuid: acc.permission, ...acc, modified: role.modified }))
      : [];

  const removePermissions = (permissions) => {
    const permissionsToRemove = permissions.reduce((acc, curr) => [...acc, curr.uuid], []);
    return dispatch(removeRolePermissions(role, permissionsToRemove)).then(() => {
      dispatch(fetchRole(role.uuid));
      internalDispatch({ type: SELECT_PERMISSIONS, selection: [] });
    });
  };

  const actionResolver = () => [
    {
      title: 'Remove',
      onClick: (_event, _rowId, permission) =>
        internalDispatch({
          type: INITIATE_REMOVE_PERMISSION,
          confirmDelete: () => removePermissions([permission]),
          deleteInfo: {
            title: 'Remove permission?',
            text: removeModalText(permission.uuid, role, false),
            confirmButtonLabel: 'Remove permission',
          },
        }),
    },
  ];

  const toolbarButtons = () =>
    window.insights.chrome.isBeta() && !role.system
      ? [
          <Link to={`/roles/detail/${role.uuid}/role-add-permission`} key="role-add-permission" className="pf-m-visible-on-md">
            <Button variant="primary" aria-label="Add Permission">
              Add Permission
            </Button>
          </Link>,
          {
            label: 'Add Permission',
            props: {
              className: 'pf-m-hidden-on-md',
            },
            onClick: () => {
              history.push(`/roles/detail/${role.uuid}/role-add-permission`);
            },
          },
          {
            label: 'Remove',
            props: {
              isDisabled: !selectedPermissions.length > 0,
            },
            onClick: () => {
              const multiplePermissionsSelected = selectedPermissions.length > 1;
              internalDispatch({
                type: INITIATE_REMOVE_PERMISSION,
                confirmDelete: () => removePermissions([...selectedPermissions]),
                deleteInfo: {
                  title: multiplePermissionsSelected ? 'Remove permissions?' : 'Remove permission?',
                  text: removeModalText(
                    multiplePermissionsSelected ? selectedPermissions.length : selectedPermissions[0].uuid,
                    role,
                    selectedPermissions.length > 1
                  ),
                  confirmButtonLabel: multiplePermissionsSelected ? 'Remove permissions' : 'Remove permission',
                },
              });
            },
          },
        ]
      : [];

  const routes = () => (
    <Route exact path={paths['role-add-permission']}>
      <AddRolePermissionWizard isOpen={true} role={role} />
    </Route>
  );

  const calculateSelected = (filter) =>
    filter.reduce(
      (acc, curr) => ({
        0: {
          ...acc?.['0'],
          [curr]: true,
        },
      }),
      { 0: {} }
    );

  const emptyItem = {
    label: <div> No results found</div>,
    isDisabled: true,
  };

  const sanitizedRole = {
    access: [],
    applications: [],
    ...role,
  };

  const filterItemOverflow = Object.values({ applications: sanitizedRole.applications, operations, resources }).find(
    (value) => value.length > maxFilterItems
  );

  return (
    <section className="pf-c-page__main-section ins-c-role__permissions">
      {showRemoveModal && (
        <RemovePermissionsModal
          text={deleteInfo.text}
          title={deleteInfo.title}
          isOpen={showRemoveModal}
          confirmButtonLabel={deleteInfo.confirmButtonLabel}
          onClose={() => internalDispatch({ type: SHOW_REMOVE_MODAL, showRemoveModal: false })}
          onSubmit={() => {
            confirmDelete();
            internalDispatch({ type: SUBMIT_REMOVE_MODAL });
          }}
        />
      )}
      <TextContent>
        <Text component={TextVariants.h1}>Permissions</Text>
      </TextContent>
      <TableToolbarView
        columns={showResourceDefinitions ? columns : columns.filter((c) => c.title !== 'Resource definitions')}
        createRows={createRows(showResourceDefinitions, role?.uuid)}
        actionResolver={role.system ? undefined : actionResolver}
        data={filteredRows.slice(pagination.offset, pagination.offset + pagination.limit)}
        filterValue=""
        ouiaId="role-permissions-table"
        fetchData={({ limit, offset }) => internalDispatch({ type: SET_PAGINATION, limit, offset })}
        isSelectable={!role.system}
        setCheckedItems={setCheckedItems}
        checkedRows={selectedPermissions}
        onShowMore={
          filterItemOverflow
            ? () => {
                internalDispatch({ type: SET_TOGGLED });
              }
            : undefined
        }
        setFilterValue={({ applications, resources, operations }) => {
          internalDispatch({
            type: SET_FILTERS,
            ...(applications ? { applications } : filters.applications),
            ...(resources ? { resources } : filters.resources),
            ...(operations ? { operations } : filters.operations),
          });
        }}
        toolbarButtons={toolbarButtons}
        isLoading={isRecordLoading}
        pagination={{
          ...pagination,
          count: filteredRows.length,
        }}
        titlePlural="permissions"
        titleSingular="permission"
        routes={routes}
        filters={[
          {
            key: 'applications',
            value: filters.applications,
            placeholder: 'Filter by application',
            type: 'group',
            selected: calculateSelected(filters.applications),
            groups: [
              {
                type: sanitizedRole.applications.length > 0 ? 'checkbox' : 'plain',
                items:
                  sanitizedRole.applications.length > 0
                    ? sanitizedRole.applications.slice(0, isToggled ? undefined : maxFilterItems).map((item) => ({ label: item, value: item }))
                    : [emptyItem],
              },
            ],
          },
          {
            key: 'resources',
            value: filters.resources,
            placeholder: 'Filter by resource type',
            type: 'group',
            selected: calculateSelected(filters.resources),
            groups: [
              {
                type: resources.length > 0 ? 'checkbox' : 'plain',
                items: resources.length > 0 ? resources.slice(0, isToggled ? undefined : maxFilterItems) : [emptyItem],
              },
            ],
          },
          {
            key: 'operations',
            value: filters.operations,
            placeholder: 'Filter by operation',
            type: 'group',
            selected: calculateSelected(filters.operations),
            groups: [
              {
                type: operations.length > 0 ? 'checkbox' : 'plain',
                items: operations.length > 0 ? operations.slice(0, isToggled ? undefined : maxFilterItems) : [emptyItem],
              },
            ],
          },
        ]}
      />
    </section>
  );
};

export default Permissions;
