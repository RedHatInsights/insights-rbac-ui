import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import debounce from 'lodash/debounce';
import { Stack, StackItem } from '@patternfly/react-core';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import { Section, DateFormat } from '@redhat-cloud-services/frontend-components';
import { PrimaryToolbar } from '@redhat-cloud-services/frontend-components/components/PrimaryToolbar';
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
    rolesWithAccess,
    isRecordLoading
}) => {

    const [ rows, setRows ] = useState([]);
    const [ filter, setFilter ] = useState('');
    const [ page, setPage ] = useState(1);
    const [ perPage, setPerPage ] = useState(20);
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
                    title: <Table
                        props={ { colSpan: 2, className: 'pf-m-no-padding' } }
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
                    title: !isRecordLoading && rolesWithAccess && rolesWithAccess[uuid]
                        ? <Table
                            props={ { colSpan: 3, className: 'pf-m-no-padding' } }
                            aria-label="Simple Table"
                            variant={ TableVariant.compact }
                            cells={ [ 'Application', 'Resource type', 'Operation' ] }
                            rows={ rolesWithAccess[uuid].access.map(access => {
                                const permissions = access.permission.split(':');
                                return { cells: permissions };
                            }) }>
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

    useEffect(() => {
        if (!isLoading) {
            setRows(createRows(roles.data));
        }
    }, [ roles ]);

    useEffect(() => {
        setRows(createRows(roles.data));
    }, [ rolesWithAccess ]);

    useEffect(() => {
        debouncedFetch(perPage, perPage * (page - 1), filter, [ 'groups_in' ], username);
    }, [ filter ]);
    useEffect(() => {
        fetchRoles({ limit: perPage, offset: perPage * (page - 1), name: filter, addFields: [ 'groups_in' ], username });
    }, [ page, perPage ]);

    const onExpand = (event, rowIndex, colIndex, isOpen, rowData) => {
        const r = [ ...rows ];
        if (!isOpen) {
            setExpanded({ ...expanded, [rowData.uuid]: colIndex });
            // Permissions
            if (colIndex === 2) {
                fetchRoleForUser(rowData.uuid);
            }

            // set all other expanded cells false in this row if we are expanding
            r[rowIndex].cells.forEach(cell => {
                if (cell.props) {cell.props.isOpen = false;}
            });
            r[rowIndex].cells[colIndex].props.isOpen = true;
            r[rowIndex].isOpen = true;
        } else {
            setExpanded({ ...expanded, [rowData.uuid]: -1 });
            r[rowIndex].cells[colIndex].props.isOpen = false;
            r[rowIndex].isOpen = r[rowIndex].cells.some(cell => cell.props && cell.props.isOpen);
        }

        setRows(r);
    };

    const onSetPage = (_e, page) => setPage(page);
    const onPerPageSelect = (_e, perPage) => setPerPage(perPage);

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
                <Section type="content" id={ 'user-detail2' }>
                <PrimaryToolbar
                    filterConfig={ { items: [{ label: 'Role',
                        filterValues: {
                            value: filter,
                            placeholder: 'Filter by role name',
                            onChange: (e, selected) =>setFilter(selected)
                        }
                    }]} }
                    pagination={ { itemCount: roles.meta.count, page, perPage, onSetPage, onPerPageSelect } }
                />
                { isLoading
                ? <ListLoader />
                : <Table
                    className='ins-c-activity-table'
                    aria-label="Collapsible table"
                    onExpand={ onExpand }
                    rows={ rows }
                    cells={ columns }>
                    <TableHeader >

                    </TableHeader>

                    <TableBody />
                </Table>
                }
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
    rolesWithAccess: PropTypes.object,
    isRecordLoading: PropTypes.bool
};

const mapStateToProps = ({ roleReducer: { roles, isLoading, rolesWithAccess, isRecordLoading }}) => ({
    roles,
    isLoading,
    rolesWithAccess,
    isRecordLoading
});

const mapDispatchToProps = dispatch => ({
    fetchRoles: (apiProps) => dispatch(fetchRoles(apiProps)),
    fetchRoleForUser: (uuid) => dispatch(fetchRoleForUser(uuid))
});

export default connect(mapStateToProps, mapDispatchToProps)(User);
