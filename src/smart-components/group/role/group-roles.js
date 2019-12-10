import React, { useState, useEffect, Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Link, Route } from 'react-router-dom';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { Button } from '@patternfly/react-core';
import { Section, DateFormat } from '@redhat-cloud-services/frontend-components';
import { mappedProps } from '../../../helpers/shared/helpers';
import { defaultCompactSettings } from '../../../helpers/shared/pagination';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { fetchRoles } from '../../../redux/actions/role-actions';
import { removeRolesFromGroup, addRolesToGroup, fetchRolesForGroup } from '../../../redux/actions/group-actions';
import AddGroupRoles from './add-group-roles';
import { defaultSettings } from '../../../helpers/shared/pagination';

const columns = [
  { title: 'Role name', orderBy: 'name' },
  { title: 'Description' },
  { title: 'Last modified' }
];

const createRows = (data, expanded, checkedRows = []) => {
  return data ? data.reduce((acc, { uuid, name, description, modified }) => ([
    ...acc, {
      uuid,
      cells: [
        name,
        description,
        <Fragment key={ `${uuid}-modified` }>
          <DateFormat date={ modified } type="relative" />
        </Fragment> ],
      selected: Boolean(checkedRows && checkedRows.find(row => row.uuid === uuid))
    }
  ]), []) : [];
};

const GroupRoles = ({
  roles,
  fetchRoles,
  removeRoles,
  addRoles,
  fetchRolesForGroup,
  isLoading,
  pagination,
  match: { params: { uuid }},
  userIdentity
}) => {
  const [ filterValue, setFilterValue ] = useState('');
  const [ selectedRoles, setSelectedRoles ] = useState([]);
  const [ selectedAddRoles, setSelectedAddRoles ] = useState([]);

  useEffect(() => {
    fetchRolesForGroup(pagination)(uuid);
  }, []);
  const setCheckedItems = (newSelection) => {
    setSelectedRoles((roles) => {
      return newSelection(roles).map(({ uuid, name, label }) => ({ uuid, label: label || name }));
    });
  };

  const actionResolver = () => (
    [
      {
        title: 'Remove from group',
        onClick: (_event, _rowId, role) => {
          removeRoles(uuid, [ role.uuid ], () => fetchRolesForGroup(pagination)(uuid));
        }
      }
    ]);

  const routes = () => <Fragment>
    <Route path={ `/groups/detail/:uuid/roles/add_roles` }
      render={ args => <AddGroupRoles
        fetchData={ fetchRoles }
        selectedRoles={ selectedAddRoles }
        setSelectedRoles={ setSelectedAddRoles }
        closeUrl={ `/groups/detail/${uuid}/roles` }
        addRolesToGroup={ addRoles }
        fetchRolesForGroup={ fetchRolesForGroup(pagination) }
        { ...args }
      /> }
    />
  </Fragment>;

  const toolbarButtons = () => [
    ...userIdentity && userIdentity.user && userIdentity.user.is_org_admin ?
      [
        <Link
          to={ `/groups/detail/${uuid}/roles/add_roles` }
          key="add-to-group"
        >
          <Button
            variant="primary"
            aria-label="Add a role"
          >
        Add a role
          </Button>
        </Link>,
        {
          label: 'Remove from group',
          props: {
            isDisabled: !selectedRoles || !selectedRoles.length > 0,
            variant: 'danger',
            onClick: () => removeRoles(selectedRoles)
          }
        }
      ] : []
  ];

  return (
    <Section type="content" id={ 'tab-roles' }>
      <TableToolbarView
        columns={ columns }
        isSelectable={ userIdentity && userIdentity.user && userIdentity.user.is_org_admin }
        createRows={ createRows }
        data={ roles }
        filterValue={ filterValue }
        fetchData={ (config => fetchRolesForGroup(config)(uuid)) }
        setFilterValue={ ({ name }) => setFilterValue(name) }
        isLoading={ isLoading }
        pagination={ pagination }
        request={ fetchRolesForGroup(pagination) }
        checkedRows={ selectedRoles }
        setCheckedItems={ setCheckedItems }
        titlePlural="roles"
        titleSingular="role"
        toolbarButtons={ toolbarButtons }
        actionResolver={ actionResolver }
        routes={ routes }
      />
    </Section>
  );
};

const reloadWrapper = (event, callback) => {
  event.payload.then(callback);
  return event;
};

const mapStateToProps = ({ groupReducer: { selectedGroup, groups }}) => {
  const roles = selectedGroup.roles;
  return {
    roles,
    pagination: selectedGroup.pagination || { ...defaultSettings, count: roles && roles.length },
    isLoading: !selectedGroup.loaded,
    userIdentity: groups.identity
  };};

const mapDispatchToProps = dispatch => {
  return {
    fetchRoles: (apiProps) => {
      dispatch(fetchRoles(mappedProps(apiProps)));
    },
    addRoles: (groupId, roles, callback) => dispatch(reloadWrapper(addRolesToGroup(groupId, roles), callback)),
    removeRoles: (groupId, roles, callback) => dispatch(reloadWrapper(removeRolesFromGroup(groupId, roles), callback)),
    fetchRolesForGroup: (pagination) => (groupId) => dispatch(fetchRolesForGroup(groupId, pagination)),
    addNotification: (...props) => dispatch(addNotification(...props))
  };
};

GroupRoles.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired
  }),
  roles: PropTypes.array,
  isLoading: PropTypes.bool,
  searchFilter: PropTypes.string,
  fetchRoles: PropTypes.func.isRequired,
  fetchRolesForGroup: PropTypes.func.isRequired,
  selectedRoles: PropTypes.array,
  addRoles: PropTypes.func,
  removeRoles: PropTypes.func,
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
    offset: PropTypes.number.isRequired,
    count: PropTypes.number
  }),
  match: PropTypes.shape({
    params: PropTypes.object.isRequired
  }).isRequired,
  userIdentity: PropTypes.shape({
    user: PropTypes.shape({
      is_org_admin: PropTypes.bool
    })
  })
};

GroupRoles.defaultProps = {
  roles: [],
  pagination: defaultCompactSettings,
  selectedRoles: [],
  userIdentity: {}
};

export default connect(mapStateToProps, mapDispatchToProps)(GroupRoles);
