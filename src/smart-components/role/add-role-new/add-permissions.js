import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import useFieldApi from '@data-driven-forms/react-form-renderer/dist/cjs/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/dist/cjs/use-form-api';

import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { listPermissions } from '../../../redux/actions/permission-action';
import { fetchRole } from '../../../redux/actions/role-actions';

const columns = [ 'Application', 'Resource type', 'Operation' ];
const selector = ({ permissionReducer: { permission, isLoading }, roleReducer: { isRecordLoading, selectedRole }}) => ({
    access: permission.data,
    pagination: permission.meta,
    isLoading: isLoading || isRecordLoading,
    baseRole: selectedRole
});
const types = [ 'application', 'resource', 'operation' ];
export const accessWrapper = (rawData, filters = { applications: [], resources: [], operations: []}) => {
    const uniqData = [ ...new Set(rawData.map(({ permission }) => permission)) ];
    const data = uniqData.map(permission => ({ ...permission.split(':').reduce((acc, val, i) => ({ ...acc, [types[i]]: val }), {}), uuid: permission }));

    const filterApplication = (item) => (filters.applications.length === 0 || filters.applications.includes(item.application));
    const filterResource = (item) => (filters.resources.length === 0 || filters.resources.includes(item.resource));
    const filterOperation = (item) => (filters.operations.length === 0 || filters.operations.includes(item.operation));
    const filterSplats = ({ application, resource, operation }) => ([ application, resource, operation ].every(permission => permission !== '*'));

    const filteredData = data.filter(permission => filterApplication(permission)
      && filterResource(permission)
      && filterOperation(permission)
      && filterSplats(permission)
    );

    return {
        data,
        filteredData,
        applications: [ ...new Set(data.filter(permission => filterResource(permission) && filterOperation(permission)).map(({ application }) => application)) ],
        resources: [ ...new Set(data.filter(permission => filterApplication(permission) && filterOperation(permission)).map(({ resource }) => resource)) ],
        operations: [ ...new Set(data.filter(permission => filterApplication(permission) && filterResource(permission)).map(({ operation }) => operation)) ]
    };
};

const AddPermissionsTable = ({ selectedPermissions, setSelectedPermissions, ...props }) => {
    const dispatch = useDispatch();
    const fetchData = (apiProps) => dispatch(listPermissions(apiProps));
    const { access, isLoading, pagination, baseRole } = useSelector(selector, shallowEqual);
    const { input } = useFieldApi(props);
    const formOptions = useFormApi();
    const [ permissions, setPermissions ] = useState({ filteredData: [], applications: [], resources: [], operations: []});
    const [ filters, setFilters ] = useState({ applications: [], resources: [], operations: []});

    const createRows = (permissions) => permissions.map(
        ({ application, resource, operation, uuid }) => ({
            uuid: `${application}:${resource}:${operation}`,
            cells: [
                application,
                resource,
                operation
            ],
            selected: Boolean(selectedPermissions && selectedPermissions.find(row => row.uuid === uuid))
        })

    );

    useEffect(() => {
        const baseRoleUuid = formOptions.getState().values['copy-base-role']?.uuid;
        if (baseRoleUuid) {
            dispatch(fetchRole(baseRoleUuid));
        }

        fetchData(pagination);

    }, []);

    useEffect(() => {
        setPermissions(accessWrapper(access, filters));
    }, [ access ]);

    useEffect(() => {
        setPermissions(accessWrapper(access, filters));
    }, [ filters ]);

    useEffect(() => {
        input.onChange(selectedPermissions);
    }, [ selectedPermissions ]);

    useEffect(() => {
        const basePermissionsions = (baseRole?.access || []).map(permission => ({ uuid: permission.permission }));
        setSelectedPermissions(basePermissionsions);
    }, [ baseRole ]);

    const setCheckedItems = (newSelection) => {
        setSelectedPermissions(newSelection(selectedPermissions).map(({ uuid }) => ({ uuid })));
    };

    return <div>
        <TableToolbarView
            columns={ columns }
            isSelectable={ true }
            isCompact={ true }
            borders={ false }
            createRows={ createRows }
            data={ permissions.filteredData }
            filterValue={ '' }
            fetchData={ ({ limit, offset }) => fetchData({ limit, offset }) }
            setFilterValue={ ({ applications, resources, operations }) => {
                setFilters({
                    ...filters,
                    ...(applications ? { applications } : {}),
                    ...(resources ? { resources } : {}),
                    ...(operations ? { operations } : {})
                });
            } }
            isLoading={ isLoading }
            pagination={ { ...pagination, count: permissions.filteredData.length } }
            checkedRows={ selectedPermissions }
            setCheckedItems={ setCheckedItems }
            titlePlural="permissions"
            titleSingular="permission"
            filters={ [
                {
                    key: 'applications', value: filters.applications, placeholder: 'Filter by application', type: 'checkbox',
                    items: permissions.applications.map(app => ({ label: app, value: app }))
                 },
                {
                    key: 'resources', value: filters.resources, placeholder: 'Filter by resource type', type: 'checkbox',
                    items: permissions.resources.map(res => ({ label: res, value: res }))

                },
                {
                    key: 'operations', value: filters.operations, placeholder: 'Filter by operation', type: 'checkbox',
                    items: permissions.operations.map(op => ({ label: op, value: op }))
                }
            ] }
            { ...props }
        />
    </div >;
};

AddPermissionsTable.propTypes = {
    selectedPermissions: PropTypes.array,
    setSelectedPermissions: PropTypes.func
};

export default AddPermissionsTable;
