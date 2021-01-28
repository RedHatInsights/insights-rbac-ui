/*eslint-disable*/
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { shallowEqual, useSelector, useDispatch, batch } from 'react-redux';
import { listPermissions, listPermissionOptions } from '../../../redux/actions/permission-action';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { ChipGroup, Chip, Badge, Text, TextContent } from '@patternfly/react-core';
import './add-role-permissions-wizard.scss';

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
      disableSelection: selectedPermissions === uuid ? true : false,
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

  useEffect(() => {
    console.log('This is my permissions/access:', selectedPermissions);
  }, [selectedPermissions]);

  return (
    <div className="ins-c-rbac-permissions-table">
      <div className="ins-c-rbac-seleted-chips">
        <ChipGroup categoryName="Selected permissions: ">
          {
            selectedPermissions.map(({uuid}) => (
            <Chip color="blue" key={uuid} onClick={() => setSelectedRolePermissions(selectedPermissions.filter((p) => p.uuid !== uuid))}>{uuid}</Chip>
          ))}
        </ChipGroup>
      </div>
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
        tableId="add-role-permissions-view"
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
