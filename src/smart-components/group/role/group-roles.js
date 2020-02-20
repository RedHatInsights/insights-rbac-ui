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
import RemoveRole from './remove-role-modal';

const columns = [
  { title: 'Name', orderBy: 'name' },
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
            { name }
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
  name,
  isDefault,
  isChanged,
  onDefaultGroupChanged
}) => {
  const [ descriptionValue, setDescriptionValue ] = useState('');
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
        isDefault={ isDefault }
        isChanged={ isChanged }
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
            aria-label="Add role"
          >
        Add role
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
              title: multipleRolesSelected ? 'Remove roles?' : 'Remove role?',
              confirmButtonLabel: selectedRoles.length > 1 ? 'Remove roles' : 'Remove role',
              text: removeModalText(
                name,
                multipleRolesSelected ? selectedRoles.length : roles.find(role => role.uuid === selectedRoles[0].uuid).name,
                multipleRolesSelected)
            });

            setShowRemoveModal(true);

          }
        }
      ] : []
  ];

  return (
    <React.Fragment>
      <RemoveRole
        text={ deleteInfo.text }
        title={ deleteInfo.title }
        isOpen={ showRemoveModal }
        isChanged={ isChanged }
        isDefault={ isDefault }
        confirmButtonLabel={ deleteInfo.confirmButtonLabel }
        onClose={ () => setShowRemoveModal(false) }

        onSubmit={ () => {
          setShowRemoveModal(false);
          confirmDelete();
          setSelectedRoles([]);
          onDefaultGroupChanged(isDefault);
        } }
      />

      <Section type="content" id={ 'tab-roles' }>
        <TableToolbarView
          columns={ columns }
          isSelectable={ userIdentity && userIdentity.user && userIdentity.user.is_org_admin }
          createRows={ (...props) => createRows(uuid, ...props) }
          data={ roles }
          filterValue={ filterValue }
          fetchData={ (config) => {
            fetchRolesForGroup(config)(uuid);
          } }
          setFilterValue={ ({ name, description }) => {
            typeof name !== 'undefined' && setFilterValue(name);
            typeof description !== 'undefined' && setDescriptionValue(description);
          } }
          isLoading={ isLoading }
          pagination={ pagination }
          checkedRows={ selectedRoles }
          setCheckedItems={ setCheckedItems }
          titlePlural="roles"
          titleSingular="role"
          toolbarButtons={ toolbarButtons }
          actionResolver={ actionResolver }
          routes={ routes }
          emptyProps={ { title: 'There are no roles in this group', description: [ 'Add a role to configure user access.', '' ]} }
          textFilters={ [
            { key: 'name', value: filterValue },
            { key: 'description', value: descriptionValue }
          ] }
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
    name: selectedGroup.name,
    isDefault: selectedGroup.platform_default,
    isChanged: selectedGroup.system
  };};

const mapDispatchToProps = dispatch => {
  return {
    fetchRoles: (apiProps) => {
      dispatch(fetchRoles(mappedProps(apiProps)));
    },
    addRoles: (groupId, roles, callback) => dispatch(reloadWrapper(addRolesToGroup(groupId, roles), callback)),
    removeRoles: (groupId, roles, callback) => dispatch(reloadWrapper(removeRolesFromGroup(groupId, roles), callback)),
    fetchRolesForGroup: (config) => (groupId, options) => dispatch(fetchRolesForGroup(groupId, config, options)),
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
  }),
  isDefault: PropTypes.bool,
  isChanged: PropTypes.bool,
  onDefaultGroupChanged: PropTypes.func
};

GroupRoles.defaultProps = {
  roles: [],
  pagination: defaultCompactSettings,
  selectedRoles: [],
  userIdentity: {}
};

export default connect(mapStateToProps, mapDispatchToProps)(GroupRoles);
