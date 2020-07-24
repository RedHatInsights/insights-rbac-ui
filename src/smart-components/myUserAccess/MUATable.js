import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import debounce from 'lodash/debounce';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';
import { fetchRoles, fetchRoleForPrincipal } from '../../redux/actions/role-actions';
import { ListLoader } from '../../presentational-components/shared/loader-placeholders';
// import classNames from 'classnames';
// import './user.scss';

import {
    Table,
    TableHeader,
    TableBody,
    TableVariant,
    compoundExpand,
    cellWidth
} from '@patternfly/react-table';

const columns = [
    'Roles',
    'Description',
    {
        title: 'Permissions',
        cellTransforms: [ compoundExpand, cellWidth(15) ]
    }
];

let debouncedFetch;

const MUATable = ({
    fetchRoles,
    fetchRoleForPrincipal,
    roles,
    isLoading,
    rolesWithAccess
}) => {

    const [ filter, setFilter ] = useState('');
    const [ expanded, setExpanded ] = useState({});

    const createRows = (data) => {
        console.log(data);
        return data ? data.reduce((acc, { uuid, name, description, accessCount }, i) => ([
            ...acc, {
                uuid,
                cells: [{ title: name, props: { component: 'th', isOpen: false }},
                { title: description, props: { isOpen: false }},
                { title: accessCount, props: { isOpen: expanded[uuid] === 2 }}
                ]
            },
            {
                uuid: `${uuid}-groups`,
                parent: 2 * i,
                compoundParent: 2,
                cells: [{
                    props: { colSpan: 4, className: 'pf-m-no-padding' },
                    title: rolesWithAccess && rolesWithAccess[uuid]
                        ? <Table
                            aria-label="Simple Table"
                            borders={ false }
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
        fetchRoles({ limit: 20, offset: 0, scope: 'principal' });
        debouncedFetch = debounce(
                (limit, offset, name, addFields) => fetchRoles({ limit, offset, name, addFields }),
            500);
    }, []);

    const onExpand = (_event, _rowIndex, colIndex, isOpen, rowData) => {
        if (!isOpen) {
            setExpanded({ ...expanded, [rowData.uuid]: colIndex });
            // Permissions
            if (colIndex === 2) {
                fetchRoleForPrincipal(rowData.uuid);
            }
        } else {
            setExpanded({ ...expanded, [rowData.uuid]: -1 });
        }
    };

    return (
        <TableToolbarView
            columns={ columns }
            isCompact={ false }
            isExpandable={ true }
            onExpand={ onExpand }
            createRows={ createRows }
            data={ roles.data }
            filterValue={ filter }
            fetchData={ ({ limit, offset, name }) => {
                debouncedFetch(limit, offset, name);} }
            setFilterValue={ ({ name }) =>  setFilter(name) }
            isLoading={ isLoading }
            pagination={ roles.meta }
            filterPlaceholder="role name"
            titlePlural="roles"
            titleSingular="role" />
    );
};

MUATable.propTypes = {
    fetchRoles: PropTypes.func,
    fetchRoleForPrincipal: PropTypes.func,
    fetchUsers: PropTypes.func,
    roles: PropTypes.object,
    isLoading: PropTypes.bool,
    rolesWithAccess: PropTypes.object,
    user: PropTypes.object
};

const mapStateToProps = ({
    roleReducer: { roles, isLoading, rolesWithAccess }
}) => ({
    roles,
    isLoading,
    rolesWithAccess
});
const mapDispatchToProps = dispatch => ({
    fetchRoles: (apiProps) => dispatch(fetchRoles(apiProps)),
    fetchRoleForPrincipal: (uuid) => dispatch(fetchRoleForPrincipal(uuid))
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(MUATable));
