import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import debounce from 'lodash/debounce';
import { Stack, StackItem } from '@patternfly/react-core';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';
import { Section, DateFormat } from '@redhat-cloud-services/frontend-components';
import { fetchRoles, fetchRoleForUser } from '../../redux/actions/role-actions';
import { ListLoader } from '../../presentational-components/shared/loader-placeholders';

import {
    Table,
    TableHeader,
    TableBody,
    TableVariant,
    compoundExpand
} from '@patternfly/react-table';

const columns = [
    'Roles',
    {
        title: 'Groups',
        cellTransforms: [ compoundExpand ]
    },
    {
        title: 'Permissions',
        cellTransforms: [ compoundExpand ]
    },
    {
        title: 'Last commit'
    }
];

let debouncedFetch;

const User = ({
    match: { params: { username }},
    fetchRoles,
    fetchRoleForUser,
    roles,
    isLoading,
    rolesWithAccess
}) => {

    const [ filter, setFilter ] = useState('');
    const [ expanded, setExpanded ] = useState({});

    const createRows = (data) => {
        return data ? data.reduce((acc, { uuid, name, groups_in = [], modified, accessCount }, i) => ([
            ...acc, {
                uuid,
                cells: [{ title: name, props: { component: 'th', isOpen: false }},
                { title: `${groups_in.length}`, props: { isOpen: expanded[uuid] === 1 }},
                { title: accessCount, props: { isOpen: expanded[uuid] === 2 }},
                { title: <DateFormat type='exact' date={ modified } /> }
                ]
            }, {
                uuid: `${uuid}-groups`,
                parent: 3 * i,
                compoundParent: 1,
                cells: [{
                    props: { colSpan: 4, className: 'pf-m-no-padding' },
                    title: <Table
                        aria-label="Simple Table"
                        variant={ TableVariant.compact }
                        cells={ [ 'Name', 'Description' ] }
                        rows={ groups_in.map(g => (
                            { cells: [{ title: <Link to={ `/groups/detail/${g.uuid}` }>{g.name}</Link> }, g.description ]}
                        )) }>
                        <TableHeader />
                        <TableBody />
                    </Table>
                }]
            },
            {
                uuid: `${uuid}-groups`,
                parent: 3 * i,
                compoundParent: 2,
                cells: [{
                    props: { colSpan: 4, className: 'pf-m-no-padding' },
                    title: rolesWithAccess && rolesWithAccess[uuid]
                        ? <Table
                            aria-label="Simple Table"
                            variant={ TableVariant.compact }
                            cells={ [ 'Application', 'Resource type', 'Operation' ] }
                            rows={ rolesWithAccess[uuid].access.map(access => ({ cells: access.permission.split(':') })) }>
                            <TableHeader />
                            <TableBody />
                        </Table>
                        : <ListLoader />

                }]
            }
        ]), []) : [];
    };

    useEffect(() => {
        fetchRoles({ limit: 20, offset: 0, addFields: [ 'groups_in' ], username });
        debouncedFetch = debounce(
                (limit, offset, name, addFields, username) => fetchRoles({ limit, offset, name, addFields, username }),
            500);

    }, []);

    const onExpand = (_event, _rowIndex, colIndex, isOpen, rowData) => {
        if (!isOpen) {
            setExpanded({ ...expanded, [rowData.uuid]: colIndex });
            // Permissions
            if (colIndex === 2) {
                fetchRoleForUser(rowData.uuid);
            }
        } else {
            setExpanded({ ...expanded, [rowData.uuid]: -1 });
        }
    };

    return (<Stack >
            <StackItem>
                <TopToolbar paddingBottm={ false }>
                    <TopToolbarTitle
                    title={ username }
                    description={ `${username}'s roles, groups and permissions.` }
                    />
                </TopToolbar>
            </StackItem>
            <StackItem>
                <Section type="content" id={ 'user-detail' }>
                        <TableToolbarView
                        columns={ columns }
                        isCompact={ false }
                        isExpandable={ true }
                        onExpand={ onExpand }
                        createRows={ createRows }
                        data={ roles.data }
                        filterValue={ filter }
                        fetchData={ ({ limit, offset, name }) => {
                            debouncedFetch(limit, offset, name, [ 'groups_in' ], username);} }
                        setFilterValue={ ({ name }) =>  setFilter(name) }
                        isLoading={ isLoading }
                        pagination={ roles.meta }
                        filterPlaceholder="role name"
                        titlePlural="roles"
                        titleSingular="role"
                        />
                </Section>
            </StackItem>
        </Stack>
    );
};

User.propTypes = {
    match: PropTypes.object,
    fetchRoles: PropTypes.func,
    fetchRoleForUser: PropTypes.func,
    roles: PropTypes.object,
    isLoading: PropTypes.bool,
    rolesWithAccess: PropTypes.object
};

const mapStateToProps = ({ roleReducer: { roles, isLoading, rolesWithAccess }}) => ({
    roles,
    isLoading,
    rolesWithAccess
});

const mapDispatchToProps = dispatch => ({
    fetchRoles: (apiProps) => dispatch(fetchRoles(apiProps)),
    fetchRoleForUser: (uuid) => dispatch(fetchRoleForUser(uuid))
});

export default connect(mapStateToProps, mapDispatchToProps)(User);
