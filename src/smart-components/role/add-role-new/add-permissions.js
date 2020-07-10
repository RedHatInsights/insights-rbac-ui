/* eslint-disable */

import React, { useState, useEffect } from 'react';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { PrimaryToolbar } from '@redhat-cloud-services/frontend-components';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';

import {
    Table,
    TableHeader,
    TableBody,
    TableVariant
} from '@patternfly/react-table';
import { getPrincipalAccess } from '../../../redux/actions/access-actions';
import { Spinner } from '@patternfly/react-core';
import useFieldApi from '@data-driven-forms/react-form-renderer/dist/cjs/use-field-api';

const columns = [ 'Application', 'Resource type', 'Operation' ];
const selector = ({ accessReducer: { access, isLoading }}) => ({
    access: access.data,
    isLoading
});
const types = [ 'application', 'resource', 'operation' ];
export const accessWrapper = (rawData, filters = { applications: [], resources: [], operations: []}) => {
    const uniqData = [ ...new Set(rawData.map(({ permission }) => permission)) ];
    const data = uniqData.map(permission => ({ ...permission.split(':').reduce((acc, val, i) => ({ ...acc, [types[i]]: val }), {}), uuid: permission }));
    const filterApplication = (item) => (filters.applications.length === 0 || filters.applications.includes(item.application));
    const filterResource = (item) => (filters.resources.length === 0 || filters.resources.includes(item.resource));
    const filterOperation = (item) => (filters.operations.length === 0 || filters.operations.includes(item.operation));
    const filteredData = data.filter(permission => filterApplication(permission) && filterResource(permission) && filterOperation(permission));

    return {
        data,
        filteredData,
        applications: [ ...new Set(data.filter(permission => filterResource(permission) && filterOperation(permission)).map(({ application }) => application)) ],
        resources: [ ...new Set(data.filter(permission => filterApplication(permission) && filterOperation(permission)).map(({ resource }) => resource)) ],
        operations: [ ...new Set(data.filter(permission => filterApplication(permission) && filterResource(permission)).map(({ operation }) => operation)) ]
    };
};

const AddPermissionsTable = (props) => {
    const dispatch = useDispatch();
    const fetchData = () => dispatch(getPrincipalAccess());
    const { access, isLoading } = useSelector(selector, shallowEqual);
    const { input } = useFieldApi(props);
    const [ permissions, setPermissions ] = useState({ filteredData: [], applications: [], resources: [], operations: []});
    const [ filters, setFilters ] = useState({ applications: [], resources: [], operations: []});
    const [ selectedPermissions, setSelectedPermissions ] = useState([]);
    const [ pagination, setPagination ] = useState({ limit: 10, offset: 0 });

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
        fetchData();
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

    const f = (newSelection,b) => {
        const a = newSelection(selectedPermissions).map(({ uuid } ) => ({ uuid }));
        setSelectedPermissions(a);
    }

    return <div>
        <TableToolbarView
            columns={ columns }
            isSelectable={ true }
            isCompact={ true }
            borders={ false }
            createRows={ createRows }
            data={ permissions.filteredData.slice(pagination.offset, pagination.offset + pagination.limit) }
            filterValue={ '' }
            fetchData={ ({limit, offset }) => setPagination({ limit, offset }) }
            setFilterValue={({ applications, resources, operations }) => {
                typeof applications !== 'undefined' && setFilters({...filters, applications});
                typeof resources !== 'undefined' && setFilters({ ...filters, resources });
                typeof operations !== 'undefined' && setFilters({ ...filters, operations });
            } }
            isLoading={ isLoading }
            pagination={{ ...pagination, count: permissions.filteredData.length } }
            checkedRows={ selectedPermissions }
            setCheckedItems={ f }
            titlePlural="permissions"
            titleSingular="permission"
            hideFilterChips
            textFilters={ [
                { 
                    key: 'applications', value: filters.applications, placeholder: 'Filter by exact application', type: 'checkbox',
                    items: permissions.applications.map(app => ({ label: app, value: app }))
                 },
                { 
                    key: 'resources', value: filters.resources, placeholder: 'Filter by exact resource', type: 'checkbox',
                    items: permissions.resources.map(res => ({ label: res, value: res }))

                },
                { 
                    key: 'operations', value: filters.operations, placeholder: 'Filter by exact operation', type: 'checkbox',
                    items: permissions.operations.map(op => ({ label: op, value: op }))
                }
            ] }
            { ...props }
        />
    </div >;
};

export default AddPermissionsTable;
