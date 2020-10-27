import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
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

const AddRolePermissionView = ({ selectedPermissions, setSelectedPermissions, role }) => {
  const dispatch = useDispatch();
  const { permissions, isLoading, pagination } = useSelector(selector, shallowEqual);
  const fetchData = (apiProps) => dispatch(listPermissions(apiProps));
  const fetchOptions = (apiProps) => dispatch(listPermissionOptions(apiProps));
  // const [checkedPermissions, setCheckedPermissions] = useState([]);

  const createRows = (permissions, checkedRows = []) => {
    console.log('268, testing checked rows: ', checkedRows);
    permissions.map(({ application, resource, operation, uuid }) => ({
      uuid: `${application}:${resource}:${operation}`,
      cells: [application, resource, operation],
      selected: Boolean(checkedRows && checkedRows.find((row) => row.uuid === uuid)),
    }));
  };

  useEffect(() => {
    fetchData(pagination);
    fetchOptions({ field: 'application', limit: 50 });
    fetchOptions({ field: 'resource_type', limit: 50 });
    fetchOptions({ field: 'verb', limit: 50 });
  }, []);

  useEffect(() => {
    console.log('269 ---- Probando lo que tengo como role en add-role-wizard: ', role);
    console.log('270, lo que tengo aqui no sirve: ', setSelectedPermissions);
    console.log('271, pagination ins add-role-permission: ', pagination);
    console.log('272, my permissions: ', selectedPermissions);
  }, []);

  useEffect(() => {
    console.log('273, testing out what we have in ');
  }, []);

  const setCheckedItems = (newSelection) => {
    console.log('Trying to see whats in my selected items in add-role-permission-view: ', newSelection);
    setSelectedPermissions((permissions) => {
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
        checkedRows={selectedPermissions || []}
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
  selectedPermissions: PropTypes.array.isRequired,
  setSelectedPermissions: PropTypes.func.isRequired,
  role: PropTypes.object,
};

export default AddRolePermissionView;
