/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { PrimaryToolbar, ConditionalFilter } from '@redhat-cloud-services/frontend-components';
import {
    Table,
    TableHeader,
    TableBody,
    textCenter,
    TableVariant
} from '@patternfly/react-table';
import {
    Button,
    Card, CardHeader, CardBody,
    Stack, StackItem,
    Breadcrumb, BreadcrumbItem,
    Split, SplitItem, ToolbarItem, Toolbar, ToolbarContent
} from '@patternfly/react-core';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { getPrincipalAccess } from '../../../redux/actions/access-actions';
import { useFieldApi } from '@data-driven-forms/react-form-renderer/dist/cjs/';
import { resetSelectedGroup } from '../../../redux/actions/group-actions';

const columns = ['Application', 'Resource type', 'Operation'];
const selector = ({ accessReducer: { access, isLoading } }) => ({
    access: access.data,
    pagination: access.meta,
    isLoading
});
const types = ['application', 'resource', 'operation'];
const accessWrapper = (rawData) => (filters = []) => {
    const uniqData = [...new Set(rawData.map(({ permission }) => permission))];
    const data = uniqData.map(permission => permission.split(':').reduce((acc, val, i) => ({ ...acc, [types[i]]: val }), {}));
    console.log(data, filters);
    const filterApplication = (item) => (filters.applications.length == 0 || filters.applications.includes(item.application));
    const filterResource = (item) => (filters.resources.length == 0 || filters.resources.includes(item.resource));
    const filterOperation = (item) => (filters.operations.length == 0 || filters.operations.includes(item.operation));
    const filteredData = data.filter(permission => filterApplication(permission) && filterResource(permission) && filterOperation(permission));

    return {
        data,
        filteredData,
        first: rawData[0],
        applications: [...new Set(data.filter(permission => filterResource(permission) && filterOperation(permission)).map(({ application }) => application))],
        resources: [...new Set(data.filter(permission => filterApplication(permission) && filterOperation(permission)).map(({ resource }) => resource))],
        operations: [...new Set(data.filter(permission => filterApplication(permission) && filterResource(permission)).map(({ operation }) => operation))]
    };
};

const AddPermissionsTable = (props) => {

    const dispatch = useDispatch();
    const fetchData = () => dispatch(getPrincipalAccess());
    const [filterValue, setFilterValue] = useState('');
    const { access, pagination, isLoading } = useSelector(selector, shallowEqual);
    const { input } = useFieldApi(props);
    const [permissions, setPermissions] = useState({ filteredData: [], applications: [], resources: [], operations: [] });
    const [filters, setFilters] = useState({ applications: [], resources: [], operations: [] });
    const [rows, setRows] = useState([]);
    const [selectedPermissions, setSelectedPermissions] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        setPermissions(accessWrapper(access)(filters));
    }, [access]);


    useEffect(() => {
        console.log(filters);
        setPermissions(accessWrapper(access)(filters));
    }, [filters]);

    useEffect(() => {
        setRows(createRows(permissions.filteredData));
    }, [permissions]);



    const createRows = (permissions) => permissions.map(
        permission => ({
            id: `${permission.application}:${permission.resource}:${permission.operation}`,
            cells: [
                permission.application,
                permission.resource,
                permission.operation
            ]
        })

    );

    const onSelect = (event, isSelected, rowId, rowData) => {
        let newRows;
        if (rowId === -1) {
            newRows = rows.map(oneRow => {
                oneRow.selected = isSelected;
                return oneRow;
            });
        } else {
            newRows = [...rows];
            newRows[rowId].selected = isSelected;
        }
        setRows(newRows);
        setSelectedPermissions(isSelected ? [...selectedPermissions, rowData.id] : selectedPermissions.filter(id => id !== rowData.id));
    };

    const onSelectAll = (selected) => {
        setSelectedPermissions(selected ? rows.map(row => row.id) : []);
        setRows(rows.map(row => {
            row.selected = selected;
            return row;
        }));
    }

    console.log('RENDER', selectedPermissions);
    return (isLoading
        ? 'LOADING'
        : <div>

            <PrimaryToolbar
                filterConfig={{
                    items: [
                        {
                            label: 'Application',
                            type: 'checkbox',
                            value: 'applications',
                            filterValues: {
                                items: permissions.applications.map(app => ({ label: app, value: app })),
                                onChange: (e, newSelection, selected) => {
                                    const isSelected = newSelection.includes(selected);
                                    setFilters({
                                        ...filters,
                                        applications: isSelected
                                            ? [...filters.applications, selected]
                                            : filters.applications.filter(app => app !== selected)
                                    });
                                }

                            },
                        },
                        {
                            label: 'Resource type',
                            type: 'checkbox',
                            value: 'resources',
                            filterValues: {
                                items: permissions.resources.map(res => ({ label: res, value: res })),
                                onChange: (e, newSelection, selected) => {
                                    const isSelected = newSelection.includes(selected);
                                    setFilters({
                                        ...filters,
                                        resources: isSelected
                                            ? [...filters.resources, selected]
                                            : filters.resources.filter(app => app !== selected)
                                    });
                                }

                            },
                        },
                        {
                            label: 'Operation',
                            type: 'checkbox',
                            value: 'operations',
                            filterValues: {
                                items: permissions.operations.map(op => ({ label: op, value: op })),
                                onChange: (e, newSelection, selected) => {
                                    const isSelected = newSelection.includes(selected);
                                    setFilters({
                                        ...filters,
                                        operations: isSelected
                                            ? [...filters.operations, selected]
                                            : filters.operations.filter(app => app !== selected)
                                    });
                                }

                            },
                        }
                    ]
                }}
                bulkSelect={{
                    checked: selectedPermissions.length > 0 && selectedPermissions.length >= permissions.filteredData.length,
                    count: 0,
                    items: [{ title: 'Select all', onClick: (e, selected) => onSelectAll(selected) }],
                    onSelect: (isSelected, e) => onSelectAll(isSelected)
                }}
                pagination={{ itemCount: permissions.filteredData.length, page: 1, perPage: 10 }}
            />
            <Table
                onSelect={onSelect}
                canSelectAll={false}
                variant={TableVariant.compact}
                aria-label="Add permissions"
                cells={columns}
                rows={rows}>
                <TableHeader />
                <TableBody />
            </Table>
        </div>);
};

export default AddPermissionsTable;
