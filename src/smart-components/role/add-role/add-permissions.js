import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import debouncePromise from '@redhat-cloud-services/frontend-components-utilities/debounce';
import usePermissions from '@redhat-cloud-services/frontend-components-utilities/RBACHook';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { expandSplats, listPermissionOptions, listPermissions, resetExpandSplats } from '../../../redux/actions/permission-action';
import { fetchResourceDefinitions } from '../../../redux/actions/cost-management-actions';
import { fetchRole } from '../../../redux/actions/role-actions';
import { DisabledRowWrapper } from './DisabledRowWrapper';
import { isEqual } from 'lodash';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';
import '../role-permissions.scss';

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
  permissions: permission.data.map(({ application, resource_type: resource, verb, permission, requires } = {}) => ({
    application,
    resource,
    operation: verb,
    uuid: permission,
    requires,
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
  const [isOrgAdmin, setIsOrgAdmin] = useState(null);
  const { auth } = useChrome();
  const dispatch = useDispatch();
  const intl = useIntl();
  const { hasAccess: hasCostAccess } = usePermissions('cost-management', ['cost-management:*:*']);
  const { hasAccess: hasRbacAccess } = usePermissions('rbac', ['rbac:*:*']);
  const columns = [
    { title: intl.formatMessage(messages.application) },
    { title: intl.formatMessage(messages.resourceType) },
    { title: intl.formatMessage(messages.operation) },
  ];

  useEffect(() => {
    const setOrgAdmin = async () => {
      const {
        identity: { user },
      } = await auth.getUser();
      setIsOrgAdmin(user.is_org_admin);
    };
    if (auth) {
      setOrgAdmin();
    }
  }, [auth]);

  const fetchData = (apiProps) =>
    dispatch(
      listPermissions({
        ...apiProps,
        ...(existingRoleId ? { exclude_roles: existingRoleId } : {}),
        allowed_only: true,
      }),
    );
  const fetchOptions = (apiProps) => dispatch(listPermissionOptions({ ...apiProps, allowedOnly: true }));
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
  const existingRoleId = formOptions.getState().values['role-uuid'];
  const [isToggled, setIsToggled] = useState(false);
  const [filterBy, setFilterBy] = useState('');
  const [value, setValue] = useState();
  const maxFilterItems = 10;

  const inventoryAccess = useMemo(() => isOrgAdmin || (hasRbacAccess ?? false), [hasRbacAccess, isOrgAdmin]);

  const getResourceType = (permission) => resourceTypes.find((r) => r.value === permission.split(':')?.[1]);
  const createRows = (permissions) =>
    permissions.map(({ application, resource, operation, uuid, requires }) => ({
      uuid: `${application}:${resource}:${operation}`,
      requires,
      cells: [
        {
          title: application,
        },
        resource,
        operation,
      ],
      selected: Boolean(selectedPermissions && selectedPermissions.find((row) => row.uuid === uuid)),
      disableSelection:
        (application === 'cost-management' && ((getResourceType(uuid) || { count: 0 }).count === 0 || !hasCostAccess)) ||
        (application === 'inventory' && !inventoryAccess),
      disabledContent:
        application === 'cost-management' ? (
          <div>
            {intl.formatMessage(hasCostAccess ? messages.configureResourcesForPermission : messages.noCostManagementPermissions)}{' '}
            {hasCostAccess ? <a href="./settings/sources">{intl.formatMessage(messages.configureCostSources)}</a> : null}
          </div>
        ) : (
          <div>{intl.formatMessage(messages.noRbacPermissions)}</div>
        ),
    }));

  const debouncedGetApplicationOptions = useCallback(
    debouncePromise(
      ({ applications, resources, operations }) =>
        fetchOptions({
          field: 'application',
          limit: 50,
          application: applications.join(),
          resourceType: resources.join(),
          verb: operations.join(),
        }),
      2000,
    ),
    [],
  );
  const debouncedGetResourceOptions = useCallback(
    debouncePromise(
      ({ applications, resources, operations }) =>
        fetchOptions({
          field: 'resource_type',
          limit: 50,
          application: applications.join(),
          resourceType: resources.join(),
          verb: operations.join(),
        }),
      2000,
    ),
    [],
  );
  const debouncedGetOperationOptions = useCallback(
    debouncePromise(
      ({ applications, resources, operations }) =>
        fetchOptions({ field: 'verb', limit: 50, application: applications.join(), resourceType: resources.join(), verb: operations.join() }),
      2000,
    ),
    [],
  );

  useEffect(() => {
    const baseRoleUuid = formOptions.getState().values['copy-base-role']?.uuid;
    if (roleType === 'copy' && baseRoleUuid) {
      dispatch(fetchRole(baseRoleUuid));
    }

    formOptions.change('has-cost-resources', false);
    fetchData(pagination);
    fetchOptions({ field: 'application', limit: 50 });
    fetchOptions({ field: 'resource_type', limit: 50 });
    fetchOptions({ field: 'verb', limit: 50 });

    return () => dispatch(resetExpandSplats());
  }, []);

  useEffect(() => {
    hasCostAccess && dispatch(fetchResourceDefinitions());
  }, [hasCostAccess]);

  useEffect(() => {
    debouncedGetResourceOptions(filters);
    debouncedGetOperationOptions(filters);
  }, [filters.applications]);

  useEffect(() => {
    debouncedGetApplicationOptions(filters);
    debouncedGetOperationOptions(filters);
  }, [filters.resources]);

  useEffect(() => {
    debouncedGetApplicationOptions(filters);
    debouncedGetResourceOptions(filters);
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

    let notAllowed = [];

    const basePermissions =
      baseRole?.access.filter((item) => {
        if (applicationOptions.includes(item?.permission?.split(':')[0])) {
          return true;
        }
        notAllowed.push(item);

        return false;
      }) || [];
    formOptions.change(
      'not-allowed-permissions',
      notAllowed.map(({ permission }) => permission),
    );
    if (expandedPermissions.length === 0 && typeof isLoadingExpandSplats === 'undefined') {
      const applications = [...new Set(basePermissions.map(({ permission }) => permission.split(':')[0]))];
      dispatch(expandSplats({ application: applications.join() }));
    } else {
      const patterns = basePermissions.map(({ permission }) => permission.replace('*', '.*'));
      setSelectedPermissions(() =>
        expandedPermissions
          .filter((p) => p.split(':')[0] !== 'cost-management' || (getResourceType(p) || { count: 0 }).count !== 0) // filter disabled rows
          .filter((p) => patterns.some((f) => p.match(f))) // filter permissions with unresolved splats
          .map((permission) => ({ uuid: permission })),
      );
      formOptions.change('base-permissions-loaded', true);
    }
  }, [permissions, baseRole]);

  const setCheckedItems = (newSelection) => {
    const newSelected = newSelection(selectedPermissions)
      .filter(({ uuid, application }) => application !== 'cost-management' || getResourceType(uuid)?.count > 0)
      .map(({ uuid, requires }) => ({ uuid, requires }));

    setSelectedPermissions(isEqual(newSelected, selectedPermissions) ? [] : newSelected);
  };

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

  const preparedFilterItems = {
    applications: [...applicationOptions].filter((item) => item.includes(filterBy)).map((app) => ({ label: app, value: app })),
    resources: [...resourceOptions].filter((item) => item.includes(filterBy)).map((res) => ({ label: res, value: res })),
    operations: [...operationOptions].filter((item) => item.includes(filterBy)).map((op) => ({ label: op, value: op })),
  };

  const emptyItem = {
    label: <div>{intl.formatMessage(messages.noResultsFound)}</div>,
    isDisabled: true,
  };

  const filterItemOverflow = preparedFilterItems[Object.keys(preparedFilterItems)[value ? value : 0]].length > maxFilterItems;
  return (
    <div className="rbac-c-permissions-table">
      <TableToolbarView
        columns={columns}
        isSelectable={true}
        isCompact={true}
        borders={false}
        rows={createRows(permissions)}
        data={permissions}
        filterValue=""
        noData={permissions?.length === 0}
        noDataDescription={[intl.formatMessage(messages.permissionNotDisplayedDescription)]}
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
        titlePlural={intl.formatMessage(messages.permissions).toLowerCase()}
        titleSingular={intl.formatMessage(messages.permission).toLowerCase()}
        showMoreTitle={intl.formatMessage(isToggled ? messages.seeLess : messages.seeMore)}
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
            placeholder: intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.application).toLowerCase() }),
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
            placeholder: intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.resourceType).toLowerCase() }),
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
            placeholder: intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.operation).toLowerCase() }),
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
        tableId="add-role-permissions"
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
