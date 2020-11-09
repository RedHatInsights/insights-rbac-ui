import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { shallowEqual, useSelector, useDispatch, batch } from 'react-redux';
import { listPermissions, listPermissionOptions } from '../../../redux/actions/permission-action';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';

const columns = ['Application', 'Resource type', 'Operation'];
const selector = ({
  permissionReducer: {
    permission,
    isLoading,
    options: { application, operation, resource },
  },
  roleReducer: { isRecordLoading, selectedRole },
}) => ({
  permissions: permission.data.map(({ application, resource_type: resource, verb, permission } = {}) => ({
    application,
    resource,
    operation: verb,
    uuid: permission,
  })),
  pagination: permission.meta,
  isLoading: isLoading || isRecordLoading,
  baseRole: selectedRole,
  applicationOptions: application.data,
  resourceOptions: resource.data,
  operationOptions: operation.data,
});

const AddRolePermissionView = ({ selectedPermissions, setSelectedRolePermissions }) => {
  const dispatch = useDispatch();
  const { permissions, isLoading, pagination } = useSelector(selector, shallowEqual);
  const fetchData = (apiProps) => dispatch(listPermissions(apiProps));
  const fetchOptions = (apiProps) => dispatch(listPermissionOptions(apiProps));

  const createRows = (permissions, expanded, checkedRows = []) =>
    permissions.map(({ application, resource, operation, uuid }) => ({
      uuid: `${application}:${resource}:${operation}`,
      cells: [application, resource, operation],
      selected: checkedRows?.some((row) => row.uuid === uuid),
    }));

  useEffect(() => {
    batch(() => {
      fetchData(pagination);
      fetchOptions({ field: 'application', limit: 50 });
      fetchOptions({ field: 'resource_type', limit: 50 });
      fetchOptions({ field: 'verb', limit: 50 });
    });
  }, []);

  const setCheckedItems = (newSelection) => {
    setSelectedRolePermissions((permissions) => {
      return newSelection(permissions).map(({ uuid }) => ({ uuid }));
    });
  };

  return (
    <div className="ins-c-rbac-permissions-table">
      <TableToolbarView
        columns={columns}
        isCompact={true}
        borders={false}
        createRows={createRows}
        data={permissions}
        fetchData={({ limit, offset, applications, resources, operations }) => {
          fetchData({
            limit,
            offset,
            application: applications,
            resourceType: resources,
            verb: operations,
          });
        }}
        isLoading={isLoading}
        pagination={{ ...pagination, count: pagination.count }}
        titlePlural="permissions"
        titleSingular="permission"
        setCheckedItems={setCheckedItems}
        checkedRows={selectedPermissions}
        isSelectable
      />
    </div>
  );
};

AddRolePermissionView.defaultProps = {
  selectedPermissions: [],
  role: {},
};

AddRolePermissionView.propTypes = {
  selectedPermissions: PropTypes.arrayOf({
    uuid: PropTypes.string.isRequired,
  }).isRequired,
  setSelectedRolePermissions: PropTypes.func.isRequired,
  role: PropTypes.object,
};

export default AddRolePermissionView;
