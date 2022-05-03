import React, { useState, useEffect, Fragment, useContext, useRef } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Link, Route, useHistory } from 'react-router-dom';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { Button, Tooltip } from '@patternfly/react-core';
import Section from '@redhat-cloud-services/frontend-components/Section';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';
import { defaultCompactSettings, defaultSettings } from '../../../helpers/shared/pagination';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import {
  removeRolesFromGroup,
  addRolesToGroup,
  fetchRolesForGroup,
  fetchAddRolesForGroup,
  fetchGroup,
  fetchSystemGroup,
} from '../../../redux/actions/group-actions';
import AddGroupRoles from './add-group-roles';
import RemoveRole from './remove-role-modal';
import paths from '../../../utilities/pathnames';
import { getDateFormat } from '../../../helpers/shared/helpers';
import PermissionsContext from '../../../utilities/permissions-context';
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
                <DateFormat date={modified} type={getDateFormat(modified)} />
              </Fragment>,
            ],
            selected: Boolean(checkedRows && checkedRows.find((row) => row.uuid === uuid)),
          },
        ],
        []
      )
    : [];
};

const generateOuiaID = (name) => {
  // given a group name, generate an OUIA ID for the 'Add role' button
  return name.toLowerCase().includes('default access') ? 'dag-add-role-button' : 'add-role-button';
};

const addRoleButton = (isDisabled, ouiaId, customTooltipText) => {
  const addRoleButtonContent = (
    <Button ouiaId={ouiaId} variant="primary" className="rbac-m-hide-on-sm" aria-label="Add role" isAriaDisabled={isDisabled}>
      Add role
    </Button>
  );

  return isDisabled ? (
    <Tooltip content={customTooltipText || 'All available roles have already been added to the group'}>{addRoleButtonContent}</Tooltip>
  ) : (
    addRoleButtonContent
  );
};

const GroupRoles = ({
  roles,
  removeRoles,
  addRoles,
  fetchRolesForGroup,
  isLoading,
  pagination,
  match: {
    params: { uuid },
  },
  name,
  isAdminDefault,
  isPlatformDefault,
  systemGroupUuid,
  isChanged,
  onDefaultGroupChanged,
  fetchAddRolesForGroup,
  disableAddRoles,
  addNotification,
  reloadGroup,
  fetchSystemGroup,
}) => {
  const [descriptionValue, setDescriptionValue] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedAddRoles, setSelectedAddRoles] = useState([]);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(() => null);
  const [deleteInfo, setDeleteInfo] = useState({});
  const { userAccessAdministrator, orgAdmin } = useContext(PermissionsContext);
  const hasPermissions = useRef(orgAdmin || userAccessAdministrator);

  useEffect(() => {
    fetchSystemGroup();
    if (uuid !== 'default-access') {
      fetchRolesForGroup(pagination)(uuid);
    } else {
      if (systemGroupUuid) {
        fetchRolesForGroup(pagination)(systemGroupUuid);
      } else {
        fetchSystemGroup();
      }
    }
  }, [systemGroupUuid]);

  useEffect(() => {
    fetchSystemGroup();
    if (uuid !== 'default-access') {
      fetchAddRolesForGroup(uuid);
    } else {
      if (systemGroupUuid) {
        fetchAddRolesForGroup(systemGroupUuid);
      } else {
        fetchSystemGroup();
      }
    }
  }, [roles, systemGroupUuid]);

  useEffect(() => {
    hasPermissions.current = orgAdmin || userAccessAdministrator;
  }, [orgAdmin, userAccessAdministrator]);

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
    ...(hasPermissions.current && !isAdminDefault
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

  const fetchUuid = uuid !== 'default-access' ? uuid : systemGroupUuid;

  const routes = () => (
    <Fragment>
      <Route
        path={paths['group-add-roles']}
        render={(args) => (
          <AddGroupRoles
            fetchUuid={fetchUuid}
            fetchGroup={() => reloadGroup(fetchUuid)}
            fetchRolesForGroup={() => fetchRolesForGroup({ ...pagination, offset: 0 })(fetchUuid)}
            selectedRoles={selectedAddRoles}
            setSelectedRoles={setSelectedAddRoles}
            closeUrl={`/groups/detail/${uuid}/roles`}
            addRolesToGroup={addRoles}
            name={name}
            isDefault={isPlatformDefault || isAdminDefault}
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
    ...(hasPermissions.current && !isAdminDefault
      ? [
          <Link
            className={`rbac-m-hide-on-sm rbac-c-button__add-role${disableAddRoles && '-disabled'}`}
            to={`/groups/detail/${uuid}/roles/add_roles`}
            key="add-to-group"
          >
            {addRoleButton(
              disableAddRoles,
              generateOuiaID(name || ''),
              isAdminDefault && 'Default admin access group roles cannot be modified manually'
            )}
          </Link>,
          {
            label: 'Add role',
            props: {
              isDisabled: disableAddRoles,
              className: 'rbac-m-hide-on-md',
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
              setConfirmDelete(
                () => () =>
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
        isDefault={isPlatformDefault || isAdminDefault}
        confirmButtonLabel={deleteInfo.confirmButtonLabel}
        onClose={() => setShowRemoveModal(false)}
        onSubmit={() => {
          setShowRemoveModal(false);
          confirmDelete();
          setSelectedRoles([]);
          onDefaultGroupChanged(isPlatformDefault && !isChanged);
        }}
      />

      <Section type="content" id={'tab-roles'}>
        <TableToolbarView
          columns={columns}
          isSelectable={hasPermissions.current && !isAdminDefault}
          createRows={(...props) => createRows(uuid, ...props)}
          data={roles}
          filterValue={filterValue}
          fetchData={(config) => {
            fetchRolesForGroup(config)(fetchUuid);
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
          emptyProps={{
            title: 'There are no roles in this group',
            description: [isAdminDefault ? 'Contact your platform service team to add roles.' : 'Add a role to configure user access.', ''],
          }}
          filters={[
            { key: 'name', value: filterValue },
            { key: 'description', value: descriptionValue },
          ]}
          tableId="group-roles"
        />
      </Section>
    </React.Fragment>
  );
};

const reloadWrapper = (event, callback) => {
  event.payload.then(callback);
  return event;
};

const mapStateToProps = ({ groupReducer: { selectedGroup, systemGroup } }) => {
  const roles = selectedGroup.roles;

  return {
    roles,
    pagination: selectedGroup.pagination || { ...defaultSettings, count: roles && roles.length },
    isLoading: !selectedGroup.loaded,
    name: selectedGroup.name,
    isPlatformDefault: selectedGroup.platform_default,
    isAdminDefault: selectedGroup.admin_default,
    isChanged: !selectedGroup.system,
    disableAddRoles: !(selectedGroup.addRoles.pagination && selectedGroup.addRoles.pagination.count > 0) || selectedGroup.admin_default,
    systemGroupUuid: systemGroup?.uuid,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    addRoles: (groupId, roles, callback) => dispatch(reloadWrapper(addRolesToGroup(groupId, roles), callback)),
    removeRoles: (groupId, roles, callback) => dispatch(reloadWrapper(removeRolesFromGroup(groupId, roles), callback)),
    fetchRolesForGroup: (config) => (groupId, options) => dispatch(fetchRolesForGroup(groupId, config, options)),
    fetchAddRolesForGroup: (groupId) => dispatch(fetchAddRolesForGroup(groupId, {}, {})),
    addNotification: (...props) => dispatch(addNotification(...props)),
    reloadGroup: (apiProps) => dispatch(fetchGroup(apiProps)),
    fetchSystemGroup: () => dispatch(fetchSystemGroup()),
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
  isAdminDefault: PropTypes.bool,
  isPlatformDefault: PropTypes.bool,
  isChanged: PropTypes.bool,
  onDefaultGroupChanged: PropTypes.func,
  disableAddRoles: PropTypes.bool.isRequired,
  addNotification: PropTypes.func,
  reloadGroup: PropTypes.func,
  systemGroupUuid: PropTypes.string,
  fetchSystemGroup: PropTypes.func,
};

GroupRoles.defaultProps = {
  roles: [],
  pagination: defaultCompactSettings,
  selectedRoles: [],
};

export default connect(mapStateToProps, mapDispatchToProps)(GroupRoles);
