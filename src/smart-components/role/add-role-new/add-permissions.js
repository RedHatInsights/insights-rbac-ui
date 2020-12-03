import React, { useCallback, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import useFieldApi from '@data-driven-forms/react-form-renderer/dist/esm/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/dist/esm/use-form-api';
import debouncePromise from '@redhat-cloud-services/frontend-components-utilities/files/debounce';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { listPermissions, listPermissionOptions, expandSplats, resetExpandSplats } from '../../../redux/actions/permission-action';
import { getResourceDefinitions } from '../../../redux/actions/cost-management-actions';
import { fetchRole } from '../../../redux/actions/role-actions';
import { DisabledRowWrapper } from './DisabledRowWrapper';

const columns = ['Application', 'Resource type', 'Operation'];
const selector = ({
  permissionReducer: {
    permission,
    isLoading,
    options: { application, operation, resource },
    expandSplats,
    isLoadingExpandSplats,
  },
  roleReducer: { isRecordLoading, selectedRole },
  costReducer: { resourceTypes },
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
  applicationOptions: application.data.filter((app) => app !== '*'),
  resourceOptions: resource.data.filter((app) => app !== '*'),
  operationOptions: operation.data.filter((app) => app !== '*'),
  expandedPermissions: expandSplats.data.map(({ permission }) => permission),
  isLoadingExpandSplats,
  resourceTypes: resourceTypes.data,
});

const AddPermissionsTable = ({ selectedPermissions, setSelectedPermissions, ...props }) => {
  const dispatch = useDispatch();
  const fetchData = (apiProps) => dispatch(listPermissions(apiProps));
  const fetchOptions = (apiProps) => dispatch(listPermissionOptions(apiProps));
  const {
    permissions,
    isLoading,
    pagination,
    baseRole,
    applicationOptions,
    resourceOptions,
    operationOptions,
    expandedPermissions,
    isLoadingExpandSplats,
    resourceTypes,
  } = useSelector(selector, shallowEqual);
  const { input } = useFieldApi(props);
  const formOptions = useFormApi();
  // TODO: use reducer when cleaning this code
  const [filters, setFilters] = useState({ applications: [], resources: [], operations: [] });
  const roleType = formOptions.getState().values['role-type']; // create/copy
  const [isToggled, setIsToggled] = useState(false);
  const [filterBy, setFilterBy] = useState('');
  const [value, setValue] = useState();
  const maxFilterItems = 10;

  const getResourceType = (permission) => resourceTypes.find((r) => r.value === permission.split(':')?.[1]);
  const createRows = (permissions) =>
    permissions.map(({ application, resource, operation, uuid }) => ({
      uuid: `${application}:${resource}:${operation}`,
      cells: [
        {
          title: application,
        },
        resource,
        operation,
      ],
      selected: Boolean(selectedPermissions && selectedPermissions.find((row) => row.uuid === uuid)),
      disableSelection: application === 'cost-management' && (getResourceType(uuid) || { count: 0 }).count === 0,
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

    dispatch(getResourceDefinitions());
    formOptions.change('has-cost-resources', false);
    fetchData(pagination);
    fetchOptions({ field: 'application', limit: 50 });
    fetchOptions({ field: 'resource_type', limit: 50 });
    fetchOptions({ field: 'verb', limit: 50 });

    return () => dispatch(resetExpandSplats());
  }, []);

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
    if (
      !baseRole ||
      roleType !== 'copy' ||
      formOptions.getState().values['base-permissions-loaded'] ||
      selectedPermissions.length > 0 ||
      formOptions.getState().values['copy-base-role']?.uuid !== baseRole?.uuid ||
      isLoadingExpandSplats ||
      isLoading
    ) {
      return;
    }

    const basePermissions = baseRole?.access || [];
    if (expandedPermissions.length === 0 && typeof isLoadingExpandSplats === 'undefined') {
      const applications = [...new Set(basePermissions.map(({ permission }) => permission.split(':')[0]))];
      dispatch(expandSplats({ application: applications.join() }));
    } else {
      const patterns = basePermissions.map(({ permission }) => permission.replace('*', '.*'));
      setSelectedPermissions(() =>
        expandedPermissions
          .filter((p) => p.split(':')[0] !== 'cost-management' || (getResourceType(p) || { count: 0 }).count !== 0) // filter disabled rows
          .filter((p) => patterns.some((f) => p.match(f))) // filter permissions with unresolved splats
          .map((permission) => ({ uuid: permission }))
      );
      formOptions.change('base-permissions-loaded', true);
    }
  }, [permissions, baseRole]);

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
    applications: [...applicationOptions].filter((item) => item.includes(filterBy)).map((app) => ({ label: app, value: app })),
    resources: [...resourceOptions].filter((item) => item.includes(filterBy)).map((res) => ({ label: res, value: res })),
    operations: [...operationOptions].filter((item) => item.includes(filterBy)).map((op) => ({ label: op, value: op })),
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
        data={permissions}
        filterValue={''}
        noData={permissions?.length === 0}
        noDataDescription={[
          'Adjust your filters and try again. Note: Applications that only have wildcard \
          permissions (for example, patch:*:*) aren’t included in this table and can’t be \
          added to your custom role.',
        ]}
        fetchData={({ limit, offset, applications, resources, operations }) => {
          fetchData({
            limit,
            offset,
            application: (applications || filters.applications).join(),
            resourceType: (resources || filters.resources).join(),
            verb: (operations || filters.operations).join(),
          });
        }}
        setFilterValue={({ applications, resources, operations }) => {
          setFilters({
            ...filters,
            ...(applications ? { applications } : filters.applications),
            ...(resources ? { resources } : filters.resources),
            ...(operations ? { operations } : filters.operations),
          });
        }}
        isLoading={isLoading || isLoadingExpandSplats}
        pagination={{ ...pagination, count: pagination.count }}
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
        rowWrapper={DisabledRowWrapper}
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
