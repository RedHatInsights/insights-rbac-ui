import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { listPermissions, listPermissionsOptions } from '../../../redux/actions/permission-action';
import debouncePromise from '@redhat-cloud-services/frontend-components-utilities/files/debounce';
import { fetchRole } from '../../../redux/actions/role-actions';

const columns = [{ title: 'Application' }, { title: 'Resource type' }, { title: 'Operation' }];

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

// This component takes care of pulling down active permissions available to be added to the current role in focus.
const AddRolePermissionView = ({ currentRole }) => {
  const dispatch = useDispatch();
  const fetchData = (apiProps) => dispatch(listPermissions(apiProps));
  const fetchOptions = (apiProps) => dispatch(listPermissionsOptions(apiProps));
  const { permissions, isLoading, pagination, applicationOptions, resourceOpptions, operationOptions } = useSelector(selector, shallowEqual);
  const [flag, setFlag] = useState(true);
  const [filters, setFilters] = useState({ applications: [], resources: [], ooperations: [] });
  // const [isToggled, setIsToggled] = useState(false);
  // const [filterBy, setFilterBy] = useState('');
  // const [value, setValue] = useState();
  // const maxFilterItems = 10;
  console.log('Testing out my flag in add-role-permission-view!', flag);

  useEffect(() => {
    setFlag(false);
    console.log('Starting to get my data together: ');
  }, []);

  useEffect(() => {
    console.log('Verifying what my current role is: ', currentRole);
    dispatch(fetchRole());
    fetchData(pagination);
    fetchOptions({ field: 'application', limit: 50 });
    fetchOptions({ field: 'resource_type', limit: 50 });
    fetchOptions({ field: 'verb', limit: 50 });

    console.log('Help me understand what pagination is: ', pagination);
  }, []);

  const createRows = (permissions) =>
    permissions.map(({ application, resource, operation, uuid }) => ({
      uuid: `${application}:${resource}:${operation}`,
      cells: [application, resource, operation],
      selected: Boolean(selectedPermissions && selectedPermissions.find((row) => row.uuid === uuid)),
    }));

  const debounbcedGetApplicationOptions = useCallback(
    debouncePromise(
      ({ applications, resources, operations }) =>
        fetchOptions({
          field: 'application',
          limit: 50,
          application: applications.join(),
          resourceType: resources.join(),
          verb: operations.join(),
        }),
      3000
    ),
    []
  );
  const debounbcedGetResourceOptions = useCallback(
    debouncePromise(
      ({ applications, resources, operations }) =>
        fetchOptions({
          field: 'resource_type',
          limit: 50,
          application: applications.join(),
          resourceType: resources.join(),
          verb: operations.join(),
        }),
      3000
    ),
    []
  );

  const debounbcedGetOperationOptions = useCallback(
    debouncePromise(
      ({ applications, resources, operations }) =>
        fetchOptions({ field: 'verb', limit: 50, application: applications.join(), resourceType: resources.join(), verb: operations.join() }),
      3000
    ),
    []
  );

  return (
    <TableToolbarView
      columns={columns}
      isSelectable={true}
      isCompact={true}
      borders={false}
      createRows={createRows}
      data={permissions}
      isLoading={isLoading}
      titlePlural="role permissions"
      titleSingular="role permission"
      fetchData={({ limit, offset, applications, resources, operations }) => {
        fetchData({
          limit,
          offset,
          application: (applications || filters.applications).join(),
          resourceType: (resources || filters.resources).join(),
          verb: (operations || filters.operations).join(),
        });
      }}
    />
  );
};

// const mapStateToProps = ({});

AddRolePermissionView.propTypes = {
  currentRole: PropTypes.object,
};

export default AddRolePermissionView;
