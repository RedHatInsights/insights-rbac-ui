import React, { useEffect, useReducer, useState } from 'react';
import PropTypes from 'prop-types';
import { cellWidth, info } from '@patternfly/react-table';
import { Button, ButtonVariant } from '@patternfly/react-core';
import { FormattedMessage, useIntl } from 'react-intl';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import SkeletonTable from '@patternfly/react-component-groups/dist/dynamic/SkeletonTable';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import AppLink from '../../presentational-components/shared/AppLink';
import useAppNavigate from '../../hooks/useAppNavigate';
import { TableToolbarView } from '../../presentational-components/shared/TableToolbarView';
import {
  INITIALIZE_ROLE,
  INITIATE_REMOVE_PERMISSION,
  SELECT_PERMISSIONS,
  SET_FILTERS,
  SET_PAGINATION,
  SET_TOGGLED,
  SHOW_REMOVE_MODAL,
  SUBMIT_REMOVE_MODAL,
  createRows,
  rolePermissionsReducer,
  rolePermissionsReducerInitialState,
} from './role-permissions-table-helpers';
import { fetchRole, removeRolePermissions } from '../../redux/actions/role-actions';
import messages from '../../Messages';
import pathnames from '../../utilities/pathnames';
import './role-permissions.scss';

const maxFilterItems = 10;

const removeModalText = (permissions, role, plural) => {
  return (
    <FormattedMessage
      {...(plural ? messages.permissionsWillNotBeGrantedThroughRole : messages.permissionWillNotBeGrantedThroughRole)}
      values={{
        b: (text) => <b>{text}</b>,
        ...(plural
          ? {
              permissions,
            }
          : {
              permission: permissions,
            }),
        role: role.name,
      }}
    />
  );
};

const Permissions = ({ cantAddPermissions, isLoading }) => {
  const intl = useIntl();
  const { role, isRecordLoading } = useSelector(
    (state) => ({
      role: state.roleReducer.selectedRole,
      isRecordLoading: state.roleReducer.isRecordLoading,
    }),
    shallowEqual,
  );

  const navigate = useAppNavigate();
  const [
    { pagination, selectedPermissions, showRemoveModal, confirmDelete, deleteInfo, filters, isToggled, resources, operations },
    internalDispatch,
  ] = useReducer(rolePermissionsReducer, rolePermissionsReducerInitialState);

  const [showResourceDefinitions, setShowResourceDefinitions] = useState(true);

  const dispatch = useDispatch();

  const columns = [
    { title: intl.formatMessage(messages.application) },
    { title: intl.formatMessage(messages.resourceType) },
    { title: intl.formatMessage(messages.operation) },
    {
      title: intl.formatMessage(messages.resourceDefinitions),
      transforms: [
        info({
          popover: intl.formatMessage(messages.resourceDefinitionsApplyToCostAndInventory),
          ariaLabel: intl.formatMessage(messages.resourceDefinitionsApplyToCostAndInventory),
        }),
      ],
    },
    { title: intl.formatMessage(messages.lastModified), transforms: [cellWidth(15)] },
  ];

  const setCheckedItems = (newSelection) => {
    // Handle both function signatures
    if (typeof newSelection === 'function') {
      // newSelection is a function that takes the current selectedPermissions and returns selected items
      internalDispatch({ type: SELECT_PERMISSIONS, selection: newSelection(selectedPermissions).map(({ uuid }) => ({ uuid })) });
    } else {
      // newSelection is an array of selected items directly
      internalDispatch({ type: SELECT_PERMISSIONS, selection: newSelection.map(({ uuid }) => ({ uuid })) });
    }
  };
  const emptyPropsDescription = cantAddPermissions
    ? ['']
    : ['To configure user access to applications,', 'add at least one permission to this role.', ''];

  useEffect(() => {
    if (Object.keys(role || {}).length > 0) {
      const { resources, operations } = Object.entries(
        role.access.reduce(
          ({ resources, operations }, { permission }) => {
            const [, resource, operation] = permission.split(':');
            return {
              resources: resources.includes(resource) ? resources : [...resources, resource],
              operations: operations.includes(operation) ? operations : [...operations, operation],
            };
          },
          { resources: [], operations: [] },
        ),
      ).reduce((acc, [key, value]) => ({ ...acc, [key]: value.map((item) => ({ label: item, value: item })) }), {});
      internalDispatch({ type: INITIALIZE_ROLE, resources, operations, count: role.access ? role.access.length : 0 });
    }

    setShowResourceDefinitions(role?.access?.find((a) => a.permission.includes('cost-management') || a.permission.includes('inventory')));
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
      title: intl.formatMessage(messages.remove),
      onClick: (_event, _rowId, permission) =>
        internalDispatch({
          type: INITIATE_REMOVE_PERMISSION,
          confirmDelete: () => removePermissions([permission]),
          deleteInfo: {
            title: intl.formatMessage(messages.removePermissionQuestion),
            text: removeModalText(permission.uuid, role, false),
            confirmButtonLabel: intl.formatMessage(messages.removePermission),
          },
        }),
    },
  ];

  const toolbarButtons = () =>
    cantAddPermissions
      ? []
      : [
          <AppLink to={pathnames['role-add-permission'].link.replace(':roleId', role.uuid)} key="role-add-permission" className="rbac-m-hide-on-sm">
            <Button variant="primary" aria-label="Add Permission">
              {intl.formatMessage(messages.addPermissions)}
            </Button>
          </AppLink>,
          {
            label: intl.formatMessage(messages.addPermission),
            props: {
              className: 'rbac-m-hide-on-md',
            },
            onClick: () => {
              navigate(pathnames['role-add-permission'].link.replace(':roleId', role.uuid));
            },
          },
          {
            label: intl.formatMessage(messages.remove),
            props: {
              isDisabled: !selectedPermissions.length > 0,
            },
            onClick: () => {
              const multiplePermissionsSelected = selectedPermissions.length > 1;
              internalDispatch({
                type: INITIATE_REMOVE_PERMISSION,
                confirmDelete: () => removePermissions([...selectedPermissions]),
                deleteInfo: {
                  title: intl.formatMessage(multiplePermissionsSelected ? messages.removePermissionsQuestion : messages.removePermissionQuestion),
                  text: removeModalText(
                    multiplePermissionsSelected ? selectedPermissions.length : selectedPermissions[0].uuid,
                    role,
                    selectedPermissions.length > 1,
                  ),
                  confirmButtonLabel: intl.formatMessage(multiplePermissionsSelected ? messages.removePermissions : messages.removePermission),
                },
              });
            },
          },
        ];

  const calculateSelected = (filter) =>
    filter.reduce(
      (acc, curr) => ({
        '': {
          ...acc?.[''],
          [curr]: true,
        },
      }),
      { '': {} },
    );

  const emptyItem = {
    label: <div> {intl.formatMessage(messages.noResultsFound)}</div>,
    isDisabled: true,
  };

  const sanitizedRole = {
    access: [],
    applications: [],
    ...role,
  };

  const filterItemOverflow = Object.values({ applications: sanitizedRole.applications, operations, resources }).find(
    (value) => value.length > maxFilterItems,
  );
  const data = filteredRows.slice(pagination.offset, pagination.offset + pagination.limit);

  return (
    <section className="pf-v5-c-page__main-section rbac-c-role__permissions">
      <WarningModal
        title={deleteInfo.title}
        isOpen={showRemoveModal}
        confirmButtonLabel={deleteInfo.confirmButtonLabel}
        confirmButtonVariant={ButtonVariant.danger}
        onClose={() => internalDispatch({ type: SHOW_REMOVE_MODAL, showRemoveModal: false })}
        onConfirm={() => {
          confirmDelete();
          internalDispatch({ type: SUBMIT_REMOVE_MODAL });
        }}
        aria-label="Remove role permissions modal"
      >
        {deleteInfo.text}
      </WarningModal>

      {isLoading ? (
        <SkeletonTable rows={pagination.limit} columns={columns.map((item) => item.title)} />
      ) : (
        <TableToolbarView
          columns={showResourceDefinitions ? columns : columns.filter((c) => c.title !== intl.formatMessage(messages.resourceDefinitions))}
          rows={createRows(showResourceDefinitions, role?.uuid, data, intl, selectedPermissions)}
          actionResolver={role.system ? undefined : actionResolver}
          data={data}
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
          titlePlural={intl.formatMessage(messages.permissions)}
          titleSingular={intl.formatMessage(messages.permission)}
          emptyProps={{
            title: intl.formatMessage(messages.noRolePermissions),
            description: emptyPropsDescription,
          }}
          filters={[
            {
              key: 'applications',
              value: filters.applications.length === 0 ? '' : filters.applications,
              placeholder: intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.application).toLowerCase() }),
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
              value: filters.resources.length === 0 ? '' : filters.resources,
              placeholder: intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.resourceType).toLowerCase() }),
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
              value: filters.operations.length === 0 ? '' : filters.operations,
              placeholder: intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.operation).toLowerCase() }),
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
          tableId="role-permissions"
        />
      )}
    </section>
  );
};

Permissions.propTypes = {
  cantAddPermissions: PropTypes.bool,
  isLoading: PropTypes.bool,
};

export default Permissions;
