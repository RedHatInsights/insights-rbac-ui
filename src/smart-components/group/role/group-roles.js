import React, { useState, useEffect, Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Link, Route, useHistory } from 'react-router-dom';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { Button, Tooltip } from '@patternfly/react-core';
import { Section, DateFormat } from '@redhat-cloud-services/frontend-components';
import { mappedProps } from '../../../helpers/shared/helpers';
import { defaultCompactSettings, defaultSettings } from '../../../helpers/shared/pagination';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { fetchRoles } from '../../../redux/actions/role-actions';
import { removeRolesFromGroup, addRolesToGroup, fetchRolesForGroup, fetchAddRolesForGroup, fetchGroup } from '../../../redux/actions/group-actions';
import AddGroupRoles from './add-group-roles';
import RemoveRole from './remove-role-modal';
import { routes as paths } from '../../../../package.json';
import './group-roles.scss';

const columns = [{ title: 'Name', orderBy: 'name' }, { title: 'Description' }, { title: 'Last modified' }];

const createRows = (groupUuid, data, expanded, checkedRows = []) => {
  return data
    ? data.reduce(
        (acc, { uuid, display_name, name, description, modified }) => [
          ...acc,
          {
            uuid,
            title: display_name || name,
            cells: [
              <Fragment key={`${uuid}-name`}>
                <Link to={`/groups/detail/${groupUuid}/roles/detail/${uuid}`}>{display_name || name}</Link>
              </Fragment>,
              description,
              <Fragment key={`${uuid}-modified`}>
                <DateFormat date={modified} type="relative" />
              </Fragment>,
            ],
            selected: Boolean(checkedRows && checkedRows.find((row) => row.uuid === uuid)),
          },
        ],
        []
      )
    : [];
};

const addRoleButton = (isDisabled) => {
  const addRoleButtonContent = (
    <Button variant="primary" aria-label="Add role" isAriaDisabled={isDisabled}>
      Add role
    </Button>
  );

  return isDisabled ? (
    <Tooltip content="All available roles have already been added to the group">{addRoleButtonContent}</Tooltip>
  ) : (
    addRoleButtonContent
  );
};

const GroupRoles = ({
  roles,
  fetchRoles,
  removeRoles,
  addRoles,
  fetchRolesForGroup,
  isLoading,
  pagination,
  match: {
    params: { uuid },
  },
  userIdentity,
  name,
  isDefault,
  isChanged,
  onDefaultGroupChanged,
  fetchAddRolesForGroup,
  disableAddRoles,
  addNotification,
}) => {
  const [descriptionValue, setDescriptionValue] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedAddRoles, setSelectedAddRoles] = useState([]);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(() => null);
  const [deleteInfo, setDeleteInfo] = useState({});

  useEffect(() => {
    fetchRolesForGroup(pagination)(uuid);
  }, []);

  useEffect(() => {
    fetchAddRolesForGroup(uuid);
  }, [roles]);

  const setCheckedItems = (newSelection) => {
    setSelectedRoles((roles) => {
      return newSelection(roles).map(({ uuid, name, label }) => ({ uuid, label: label || name }));
    });
  };

  const removeModalText = (name, role, plural) => (
    <p>
      Members in the <b>{name}</b> group will lose the permissions in {plural ? 'these' : 'the'}
      <b> {role}</b> role{plural ? `s` : ''}.
    </p>
  );

  const actionResolver = () => [
    ...(userIdentity && userIdentity.user && userIdentity.user.is_org_admin
      ? [
          {
            title: 'Remove',
            onClick: (_event, _rowId, role) => {
              setConfirmDelete(() => () => removeRoles(uuid, [role.uuid], () => fetchRolesForGroup({ ...pagination, offset: 0 })(uuid)));
              setDeleteInfo({
                title: 'Remove role?',
                confirmButtonLabel: 'Remove role',
                text: removeModalText(name, role.title, false),
              });
              setShowRemoveModal(true);
            },
          },
        ]
      : []),
  ];

  const routes = () => (
    <Fragment>
      <Route
        path={paths['group-add-roles']}
        render={(args) => (
          <AddGroupRoles
            fetchData={fetchRoles}
            fetchRolesForGroup={() => fetchRolesForGroup({ ...pagination, offset: 0 })(uuid)}
            selectedRoles={selectedAddRoles}
            setSelectedRoles={setSelectedAddRoles}
            closeUrl={`/groups/detail/${uuid}/roles`}
            addRolesToGroup={addRoles}
            name={name}
            isDefault={isDefault}
            isChanged={isChanged}
            addNotification={addNotification}
            onDefaultGroupChanged={onDefaultGroupChanged}
            {...args}
          />
        )}
      />
    </Fragment>
  );

  const history = useHistory();

  const toolbarButtons = () => [
    ...(userIdentity && userIdentity.user && userIdentity.user.is_org_admin
      ? [
          <Link
            className={`pf-m-visible-on-md ins-c-button__add-role${disableAddRoles && '-disabled'}`}
            to={`/groups/detail/${uuid}/roles/add_roles`}
            key="add-to-group"
          >
            {addRoleButton(disableAddRoles)}
          </Link>,
          {
            label: 'Add role',
            props: {
              isDisabled: disableAddRoles,
              className: 'pf-m-hidden-on-md',
            },
            onClick: () => {
              history.push(`/groups/detail/${uuid}/roles/add_roles`);
            },
          },
          {
            label: 'Remove',
            props: {
              isDisabled: !selectedRoles || !selectedRoles.length > 0,
              variant: 'danger',
            },
            onClick: () => {
              const multipleRolesSelected = selectedRoles.length > 1;
              setConfirmDelete(() => () =>
                removeRoles(
                  uuid,
                  selectedRoles.map((role) => role.uuid),
                  () => fetchRolesForGroup({ ...pagination, offset: 0 })(uuid)
                )
              );
              setDeleteInfo({
                title: multipleRolesSelected ? 'Remove roles?' : 'Remove role?',
                confirmButtonLabel: selectedRoles.length > 1 ? 'Remove roles' : 'Remove role',
                text: removeModalText(
                  name,
                  multipleRolesSelected ? selectedRoles.length : roles.find((role) => role.uuid === selectedRoles[0].uuid).name,
                  multipleRolesSelected
                ),
              });

              setShowRemoveModal(true);
            },
          },
        ]
      : []),
  ];

  return (
    <React.Fragment>
      <RemoveRole
        text={deleteInfo.text}
        title={deleteInfo.title}
        isOpen={showRemoveModal}
        isChanged={isChanged}
        isDefault={isDefault}
        confirmButtonLabel={deleteInfo.confirmButtonLabel}
        onClose={() => setShowRemoveModal(false)}
        onSubmit={() => {
          setShowRemoveModal(false);
          confirmDelete();
          setSelectedRoles([]);
          onDefaultGroupChanged(isDefault && !isChanged);
        }}
      />

      <Section type="content" id={'tab-roles'}>
        <TableToolbarView
          columns={columns}
          isSelectable={userIdentity && userIdentity.user && userIdentity.user.is_org_admin}
          createRows={(...props) => createRows(uuid, ...props)}
          data={roles}
          filterValue={filterValue}
          fetchData={(config) => {
            fetchRolesForGroup(config)(uuid);
          }}
          setFilterValue={({ name, description }) => {
            typeof name !== 'undefined' && setFilterValue(name);
            typeof description !== 'undefined' && setDescriptionValue(description);
          }}
          isLoading={isLoading}
          pagination={pagination}
          checkedRows={selectedRoles}
          setCheckedItems={setCheckedItems}
          titlePlural="roles"
          titleSingular="role"
          toolbarButtons={toolbarButtons}
          actionResolver={actionResolver}
          routes={routes}
          ouiaId="roles-table"
          emptyProps={{ title: 'There are no roles in this group', description: ['Add a role to configure user access.', ''] }}
          filters={[
            { key: 'name', value: filterValue },
            { key: 'description', value: descriptionValue },
          ]}
        />
      </Section>
    </React.Fragment>
  );
};

const reloadWrapper = (event, callback) => {
  event.payload.then(callback);
  return event;
};

const mapStateToProps = ({ groupReducer: { selectedGroup, groups } }) => {
  const roles = selectedGroup.roles;

  return {
    roles,
    pagination: selectedGroup.pagination || { ...defaultSettings, count: roles && roles.length },
    isLoading: !selectedGroup.loaded,
    userIdentity: groups.identity,
    name: selectedGroup.name,
    isDefault: selectedGroup.platform_default,
    isChanged: !selectedGroup.system,
    disableAddRoles: !(selectedGroup.addRoles.pagination && selectedGroup.addRoles.pagination.count > 0),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    fetchRoles: (apiProps) => {
      dispatch(fetchRoles(mappedProps(apiProps)));
    },
    addRoles: (groupId, roles, callback) => dispatch(reloadWrapper(addRolesToGroup(groupId, roles), callback)),
    removeRoles: (groupId, roles, callback) => dispatch(reloadWrapper(removeRolesFromGroup(groupId, roles), callback)),
    fetchRolesForGroup: (config) => (groupId, options) => dispatch(fetchRolesForGroup(groupId, config, options)),
    fetchAddRolesForGroup: (groupId) => dispatch(fetchAddRolesForGroup(groupId, {}, {})),
    addNotification: (...props) => dispatch(addNotification(...props)),
    fetchGroup: (apiProps) => dispatch(fetchGroup(apiProps)),
  };
};

GroupRoles.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
  }),
  roles: PropTypes.array,
  isLoading: PropTypes.bool,
  searchFilter: PropTypes.string,
  fetchRoles: PropTypes.func.isRequired,
  fetchRolesForGroup: PropTypes.func.isRequired,
  fetchAddRolesForGroup: PropTypes.func.isRequired,
  selectedRoles: PropTypes.array,
  addRoles: PropTypes.func,
  name: PropTypes.string,
  removeRoles: PropTypes.func,
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
    offset: PropTypes.number.isRequired,
    count: PropTypes.number,
  }),
  match: PropTypes.shape({
    params: PropTypes.object.isRequired,
  }).isRequired,
  userIdentity: PropTypes.shape({
    user: PropTypes.shape({
      is_org_admin: PropTypes.bool,
    }),
  }),
  isDefault: PropTypes.bool,
  isChanged: PropTypes.bool,
  onDefaultGroupChanged: PropTypes.func,
  disableAddRoles: PropTypes.bool.isRequired,
  addNotification: PropTypes.func,
};

GroupRoles.defaultProps = {
  roles: [],
  pagination: defaultCompactSettings,
  selectedRoles: [],
  userIdentity: {},
};

export default connect(mapStateToProps, mapDispatchToProps)(GroupRoles);
