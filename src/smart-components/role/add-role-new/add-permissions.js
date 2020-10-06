/* eslint-disable no-unused-vars */
import React, { useCallback, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import useFieldApi from '@data-driven-forms/react-form-renderer/dist/cjs/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/dist/cjs/use-form-api';
import debouncePromise from '@redhat-cloud-services/frontend-components-utilities/files/debounce';
import flatMap from 'lodash/flatMap';
import debounce from 'lodash/debounce';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { listPermissions, listPermissionOptions } from '../../../redux/actions/permission-action';
import { fetchRole } from '../../../redux/actions/role-actions';

const columns = ['Application', 'Resource type', 'Operation'];
const selector = ({
  permissionReducer: {
    permission,
    isLoading,
    options: { application, operation, resource, isLoadingApplication, isLoadingOperation, isLoadingResource },
  },
  roleReducer: { isRecordLoading, selectedRole },
}) => ({
  access: permission.data,
  pagination: permission.meta,
  isLoading: isLoading || isRecordLoading,
  baseRole: selectedRole,
  applicationOptions: application.data,
  resourceOptions: resource.data,
  operationOptions: operation.data,
});
const types = ['application', 'resource', 'operation'];
export const accessWrapper = (rawData, filters = { applications: [], resources: [], operations: [] }) => {
  const uniqData = [...new Set(rawData.map(({ permission }) => permission))];
  const data = uniqData.map((permission) => ({
    ...permission.split(':').reduce((acc, val, i) => ({ ...acc, [types[i]]: val }), {}),
    uuid: permission,
  }));

  const filterApplication = (item) => filters.applications.length === 0 || filters.applications.includes(item.application);
  const filterResource = (item) => filters.resources.length === 0 || filters.resources.includes(item.resource);
  const filterOperation = (item) => filters.operations.length === 0 || filters.operations.includes(item.operation);
  const filterSplats = ({ application, resource, operation }) => [application, resource, operation].every((permission) => permission !== '*');

  const filteredData = data.filter(
    (permission) => filterApplication(permission) && filterResource(permission) && filterOperation(permission) && filterSplats(permission)
  );

  return {
    data: data.filter((permission) => filterSplats(permission)),
    filteredData,
    applications: [
      ...new Set(data.filter((permission) => filterResource(permission) && filterOperation(permission)).map(({ application }) => application)),
    ],
    resources: [
      ...new Set(data.filter((permission) => filterApplication(permission) && filterOperation(permission)).map(({ resource }) => resource)),
    ],
    operations: [
      ...new Set(data.filter((permission) => filterApplication(permission) && filterResource(permission)).map(({ operation }) => operation)),
    ],
  };
};

export const resolveSplats = (selectedPermissions, permissions) => {
  return permissions.length > 0
    ? flatMap(selectedPermissions, ({ uuid: permission }) => {
        if (permission.includes('*')) {
          const [application, resource, operation] = permission.split(':');
          return permissions
            .filter(
              (p) =>
                p.application === application && (resource === '*' || resource === p.resource) && (operation === '*' || operation === p.operation)
            )
            .map(({ application, resource, operation }) => ({ uuid: `${application}:${resource}:${operation}` }));
        }

        return { uuid: permission };
      })
    : selectedPermissions;
};

const AddPermissionsTable = ({ selectedPermissions, setSelectedPermissions, ...props }) => {
  const dispatch = useDispatch();
  const fetchData = (apiProps) => dispatch(listPermissions(apiProps));
  const fetchOptions = (apiProps) => dispatch(listPermissionOptions(apiProps));
  const { access, isLoading, pagination, baseRole, applicationOptions, resourceOptions, operationOptions } = useSelector(selector, shallowEqual);
  const { input } = useFieldApi(props);
  const formOptions = useFormApi();
  // TODO: use reducer when cleaning this code
  const [permissions, setPermissions] = useState({ data: [], filteredData: [], applications: [], resources: [], operations: [] });
  const [filters, setFilters] = useState({ applications: [], resources: [], operations: [] });
  const roleType = formOptions.getState().values['role-type']; // create/copy
  const [isToggled, setIsToggled] = useState(false);
  const [filterBy, setFilterBy] = useState('');
  const [value, setValue] = useState();
  const maxFilterItems = 10;
  const [applications, setApplications] = useState([]);
  const [resources, setResources] = useState([]);
  const [operations, setOperations] = useState([]);

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

  useEffect(() => {
    const baseRoleUuid = formOptions.getState().values['copy-base-role']?.uuid;
    if (roleType === 'copy' && baseRoleUuid) {
      dispatch(fetchRole(baseRoleUuid));
    }

    fetchData(pagination);
    fetchOptions({ field: 'application', limit: 50 });
    fetchOptions({ field: 'resource_type', limit: 50 });
    fetchOptions({ field: 'verb', limit: 50 });
  }, []);

  useEffect(() => {
    setApplications(applicationOptions);
  }, [applicationOptions]);

  useEffect(() => {
    setResources(resourceOptions);
  }, [resourceOptions]);

  useEffect(() => {
    setOperations(operationOptions);
  }, [operationOptions]);

  useEffect(() => {
    setPermissions(accessWrapper(access, filters));
  }, [access]);

  useEffect(() => {
    setPermissions(accessWrapper(access, filters));
  }, [filters]);

  useEffect(() => {
    debounbcedGetResourceOptions(filters);
    debounbcedGetOperationOptions(filters);
  }, [filters.applications]);

  useEffect(() => {
    debounbcedGetApplicationOptions(filters);
    debounbcedGetOperationOptions(filters);
  }, [filters.resources]);

  useEffect(() => {
    debounbcedGetApplicationOptions(filters);
    debounbcedGetResourceOptions(filters);
  }, [filters.operations]);

  useEffect(() => {
    input.onChange(selectedPermissions);
  }, [selectedPermissions]);

  useEffect(() => {
    if (baseRole && roleType === 'copy') {
      setSelectedPermissions(() =>
        resolveSplats(
          (baseRole?.access || []).map((permission) => ({ uuid: permission.permission })),
          permissions.data
        )
      );
    } else {
      setSelectedPermissions(() => resolveSplats(selectedPermissions, permissions.data));
    }
  }, [permissions.data, baseRole]);

  const setCheckedItems = (newSelection) => {
    setSelectedPermissions(newSelection(selectedPermissions).map(({ uuid }) => ({ uuid })));
  };

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

  const preparedFilterItems = {
    applications: [...permissions.applications].filter((item) => item.includes(filterBy)).map((app) => ({ label: app, value: app })),
    resources: [...permissions.resources].filter((item) => item.includes(filterBy)).map((res) => ({ label: res, value: res })),
    operations: [...permissions.operations].filter((item) => item.includes(filterBy)).map((op) => ({ label: op, value: op })),
  };

  const emptyItem = {
    label: <div> No results found</div>,
    isDisabled: true,
  };

  const filterItemOverflow = preparedFilterItems[Object.keys(preparedFilterItems)[value ? value : 0]].length > maxFilterItems;
  return (
    <div className="ins-c-rbac-permissions-table">
      <TableToolbarView
        columns={columns}
        isSelectable={true}
        isCompact={true}
        borders={false}
        createRows={createRows}
        data={permissions.filteredData}
        filterValue={''}
        fetchData={({ limit, offset }) => fetchData({ limit, offset })}
        setFilterValue={({ applications, resources, operations }) => {
          setFilters({
            ...filters,
            ...(applications ? { applications } : filters.applications),
            ...(resources ? { resources } : filters.resources),
            ...(operations ? { operations } : filters.operations),
          });
        }}
        isLoading={isLoading}
        pagination={{ ...pagination, count: permissions.filteredData.length }}
        checkedRows={selectedPermissions}
        setCheckedItems={setCheckedItems}
        titlePlural="permissions"
        titleSingular="permission"
        showMoreTitle={isToggled ? 'See less' : 'See more'}
        onFilter={(filterBy) => setFilterBy(filterBy)}
        onShowMore={
          filterItemOverflow
            ? () => {
                setIsToggled(() => !isToggled);
              }
            : undefined
        }
        onChange={(e, value) => {
          setFilterBy('');
          setValue(value);
        }}
        value={value}
        filters={[
          {
            key: 'applications',
            value: filters.applications,
            placeholder: 'Filter by application',
            type: 'group',
            selected: calculateSelected(filters.applications),
            groups: [
              {
                type: preparedFilterItems.applications.length > 0 ? 'checkbox' : 'plain',
                items:
                  preparedFilterItems.applications.length > 0
                    ? [...preparedFilterItems.applications].slice(0, isToggled ? undefined : maxFilterItems)
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
                type: preparedFilterItems.resources.length > 0 ? 'checkbox' : 'plain',
                items:
                  preparedFilterItems.resources.length > 0
                    ? [...preparedFilterItems.resources].slice(0, isToggled ? undefined : maxFilterItems)
                    : [emptyItem],
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
                type: preparedFilterItems.operations.length > 0 ? 'checkbox' : 'plain',
                items:
                  preparedFilterItems.operations.length > 0
                    ? [...preparedFilterItems.operations].slice(0, isToggled ? undefined : maxFilterItems)
                    : [emptyItem],
              },
            ],
          },
        ]}
        isFilterable={true}
        {...props}
      />
    </div>
  );
};

AddPermissionsTable.propTypes = {
  selectedPermissions: PropTypes.array,
  setSelectedPermissions: PropTypes.func,
};

export default AddPermissionsTable;
