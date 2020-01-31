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
import RemoveModal from '../../../presentational-components/shared/RemoveModal';

const columns = [
  { title: 'Role name', orderBy: 'name' },
  { title: 'Description' },
  { title: 'Last modified' }
];

const createRows = (groupUuid, data, expanded, checkedRows = []) => {
  return data ? data.reduce((acc, { uuid, name, description, modified }) => ([
    ...acc, {
      uuid,
      cells: [
        <Fragment key={ `${uuid}-name` }>
          <Link to={ `/groups/detail/${groupUuid}/roles/detail/${uuid}` }>
            <Button variant="link"> { name } </Button>
          </Link>
        </Fragment>,
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
  userIdentity,
  name
}) => {
  const [ filterValue, setFilterValue ] = useState('');
  const [ selectedRoles, setSelectedRoles ] = useState([]);
  const [ selectedAddRoles, setSelectedAddRoles ] = useState([]);
  const [ showRemoveModal, setShowRemoveModal ] = useState(false);
  const [ confirmDelete, setConfirmDelete ] = useState(() => null);
  const [ deleteInfo, setDeleteInfo ] = useState({});

  useEffect(() => {
    fetchRolesForGroup(pagination)(uuid);
  }, []);
  const setCheckedItems = (newSelection) => {
    setSelectedRoles((roles) => {
      return newSelection(roles).map(({ uuid, name, label }) => ({ uuid, label: label || name }));
    });
  };

  const removeModalText = (name, role, plural) => (
    <p>
      Members in the <b>{ name }</b> group will lose the permissions in { plural ? 'these' : 'the' }
      <b> { role }</b> role{ plural ? `s` : '' }.
    </p>
  );

  const actionResolver = () => [
    ...userIdentity && userIdentity.user && userIdentity.user.is_org_admin ?
      [
        {
          title: 'Remove from group',
          onClick: (_event, _rowId, role) => {
            setConfirmDelete(() => () => removeRoles(uuid, [ role.uuid ], () => fetchRolesForGroup(pagination)(uuid)));
            setDeleteInfo({
              title: 'Remove role?',
              confirmButtonLabel: 'Remove role',
              text: removeModalText(name, role['role-name'].title, false)
            });
            setShowRemoveModal(true);
          }
        }
      ] : []
  ];

  const routes = () => <Fragment>
    <Route path={ `/groups/detail/:uuid/roles/add_roles` }
      render={ args => <AddGroupRoles
        fetchData={ fetchRoles }
        selectedRoles={ selectedAddRoles }
        setSelectedRoles={ setSelectedAddRoles }
        closeUrl={ `/groups/detail/${uuid}/roles` }
        addRolesToGroup={ addRoles }
        fetchRolesForGroup={ fetchRolesForGroup(pagination) }
        name={ name }
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
            variant: 'danger'
          },
          onClick: () => {
            const multipleRolesSelected = selectedRoles.length > 1;
            setConfirmDelete(() => () => removeRoles(uuid, selectedRoles.map(role => role.uuid), () => fetchRolesForGroup(pagination)(uuid)));
            setDeleteInfo({
              title: 'Remove roles?',
              confirmButtonLabel: selectedRoles.length > 1 ? 'Remove roles' : 'Remove role',
              text: removeModalText(name, multipleRolesSelected ? selectedRoles.length : selectedRoles[0].label, multipleRolesSelected)
            });
            setShowRemoveModal(true);
          }
        }
      ] : []
  ];

  return (
    <React.Fragment>
      <RemoveModal
        text={ deleteInfo.text }
        title={ deleteInfo.title }
        isOpen={ showRemoveModal }
        confirmButtonLabel={ deleteInfo.confirmButtonLabel }
        onClose={ () => setShowRemoveModal(false) }
        onSubmit={ () => {
          setShowRemoveModal(false);
          confirmDelete();
        } }
      />
      <Section type="content" id={ 'tab-roles' }>
        <TableToolbarView
          columns={ columns }
          isSelectable={ userIdentity && userIdentity.user && userIdentity.user.is_org_admin }
          createRows={ (...props) => createRows(uuid, ...props) }
          data={ roles }
          filterValue={ filterValue }
          fetchData={ config => fetchRolesForGroup(config)(uuid) }
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
    </React.Fragment>

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
    userIdentity: groups.identity,
    name: selectedGroup.name
  };};

const mapDispatchToProps = dispatch => {
  return {
    fetchRoles: (apiProps) => {
      dispatch(fetchRoles(mappedProps(apiProps)));
    },
    addRoles: (groupId, roles, callback) => dispatch(reloadWrapper(addRolesToGroup(groupId, roles), callback)),
    removeRoles: (groupId, roles, callback) => dispatch(reloadWrapper(removeRolesFromGroup(groupId, roles), callback)),
    fetchRolesForGroup: (pagination) => (groupId, options) => dispatch(fetchRolesForGroup(groupId, pagination, options)),
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
  name: PropTypes.string,
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
