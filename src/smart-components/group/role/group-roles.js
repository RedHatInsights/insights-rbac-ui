import React, { Fragment, Suspense, useContext, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FormattedMessage, useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Outlet, useParams } from 'react-router-dom';
import { Button, Tooltip } from '@patternfly/react-core';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import Section from '@redhat-cloud-services/frontend-components/Section';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';
import { defaultCompactSettings, defaultSettings } from '../../../helpers/shared/pagination';
import { TableToolbarView } from '../../../presentational-components/shared/TableToolbarView';
import {
  addRolesToGroup,
  fetchAddRolesForGroup,
  fetchGroup,
  fetchGroups,
  fetchRolesForGroup,
  fetchSystemGroup,
  removeRolesFromGroup,
} from '../../../redux/actions/group-actions';
import RemoveRole from './remove-role-modal';
import { getBackRoute, getDateFormat } from '../../../helpers/shared/helpers';
import PermissionsContext from '../../../utilities/permissions-context';
import AppLink from '../../../presentational-components/shared/AppLink';
import useAppNavigate from '../../../hooks/useAppNavigate';
import { DEFAULT_ACCESS_GROUP_ID } from '../../../utilities/constants';
import messages from '../../../Messages';
import pathnames from '../../../utilities/pathnames';
import './group-roles.scss';

const createRows = (groupId, roles, checkedRows = []) =>
  roles?.reduce(
    (acc, { uuid, display_name, name, description, modified }) => [
      ...acc,
      {
        uuid,
        title: display_name || name,
        cells: [
          <Fragment key={`${uuid}-name`}>
            <AppLink to={pathnames['group-detail-role-detail'].link.replace(':groupId', groupId).replace(':roleId', uuid)}>
              {display_name || name}
            </AppLink>
          </Fragment>,
          description,
          <Fragment key={`${uuid}-modified`}>
            <DateFormat date={modified} type={getDateFormat(modified)} />
          </Fragment>,
        ],
        selected: Boolean(checkedRows && checkedRows.find((row) => row.uuid === uuid)),
      },
    ],
    [],
  ) || [];

const generateOuiaID = (name) => {
  // given a group name, generate an OUIA ID for the 'Add role' button
  return name.toLowerCase().includes('default access') ? 'dag-add-role-button' : 'add-role-button';
};

const addRoleButton = (isDisabled, ouiaId, customTooltipText) => {
  const intl = useIntl();
  const addRoleButtonContent = (
    <Button ouiaId={ouiaId} variant="primary" className="rbac-m-hide-on-sm" aria-label="Add role" isAriaDisabled={isDisabled}>
      {intl.formatMessage(messages.addRole)}
    </Button>
  );

  return isDisabled ? (
    <Tooltip content={customTooltipText || intl.formatMessage(messages.allRolesAdded)}>{addRoleButtonContent}</Tooltip>
  ) : (
    addRoleButtonContent
  );
};

const reducer = ({ groupReducer: { selectedGroup, systemGroup, groups } }) => ({
  roles: selectedGroup.roles?.data || [],
  pagination: { ...defaultSettings, ...(selectedGroup.roles?.meta || {}) },
  groupsPagination: groups.pagination || groups.meta,
  groupsFilters: groups.filters,
  isLoading: selectedGroup.roles?.isLoading,
  isPlatformDefault: selectedGroup.platform_default,
  isAdminDefault: selectedGroup.admin_default,
  isChanged: !selectedGroup.system,
  disableAddRoles:
    /**
     * First validate if the pagination object exists and is not empty.
     * If empty or undefined, the disable condition will be always true
     */
    Object.keys(selectedGroup.addRoles.pagination || {}).length > 0
      ? !(selectedGroup.addRoles.pagination && selectedGroup.addRoles.pagination.count > 0) || !!selectedGroup.admin_default
      : !!selectedGroup.admin_default,
  systemGroupUuid: systemGroup?.uuid,
  group: selectedGroup,
});

const GroupRoles = ({ onDefaultGroupChanged }) => {
  const intl = useIntl();
  const chrome = useChrome();
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const { groupId } = useParams();
  const [descriptionValue, setDescriptionValue] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedAddRoles, setSelectedAddRoles] = useState([]);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(() => null);
  const [deleteInfo, setDeleteInfo] = useState({});
  const { userAccessAdministrator, orgAdmin } = useContext(PermissionsContext);
  const hasPermissions = useRef(orgAdmin || userAccessAdministrator);
  const {
    roles,
    pagination,
    groupsPagination,
    groupsFilters,
    isLoading,
    group,
    isPlatformDefault,
    isAdminDefault,
    isChanged,
    disableAddRoles,
    systemGroupUuid,
  } = useSelector(reducer);

  const reloadWrapper = (event, callback) => {
    event.payload.then(callback);
    return event;
  };

  const fetchAddGroupRoles = (groupId) => dispatch(fetchAddRolesForGroup(groupId, {}, {}));
  const fetchGroupData = (customId) => dispatch(fetchGroup(customId ?? groupId));
  const fetchSystGroup = () => dispatch(fetchSystemGroup({ chrome }));
  const removeRoles = (groupId, roles, callback) => dispatch(reloadWrapper(removeRolesFromGroup(groupId, roles), callback));
  const fetchGroupRoles = (pagination) => (groupId, options) => dispatch(fetchRolesForGroup(groupId, pagination, options));

  const columns = [
    { title: intl.formatMessage(messages.name), orderBy: 'name' },
    { title: intl.formatMessage(messages.description) },
    { title: intl.formatMessage(messages.lastModified) },
  ];

  useEffect(() => {
    if (groupId !== DEFAULT_ACCESS_GROUP_ID) {
      fetchGroupRoles({ ...pagination, offset: 0 })(groupId);
    } else {
      systemGroupUuid && fetchGroupRoles({ ...pagination, offset: 0 })(systemGroupUuid);
    }
  }, [systemGroupUuid]);

  useEffect(() => {
    if (roles.length > 0) {
      if (groupId !== DEFAULT_ACCESS_GROUP_ID) {
        fetchAddGroupRoles(groupId);
      } else {
        systemGroupUuid && fetchAddGroupRoles(systemGroupUuid);
      }
    }
  }, [roles]);

  useEffect(() => {
    hasPermissions.current = orgAdmin || userAccessAdministrator;
  }, [orgAdmin, userAccessAdministrator]);

  const setCheckedItems = (newSelection) => {
    setSelectedRoles((roles) => newSelection(roles).map(({ uuid, name, label }) => ({ uuid, label: label || name })));
  };

  const removeModalText = (name, role, plural) => (
    <p>
      <FormattedMessage
        {...(plural ? messages.removeRolesModalText : messages.removeRoleModalText)}
        values={{
          b: (text) => <b>{text}</b>,
          name,
          ...(plural ? { roles: role } : { role }),
        }}
      />
    </p>
  );

  const fetchUuid = groupId !== DEFAULT_ACCESS_GROUP_ID ? groupId : systemGroupUuid;

  const removeRolesCallback = () => {
    if (isPlatformDefault) {
      fetchSystGroup().then(({ value: { data } }) => {
        fetchGroupRoles({ ...pagination, offset: 0 })(data[0].uuid);
      });
    } else {
      fetchGroupRoles({ ...pagination, offset: 0 })(groupId);
    }
  };

  const actionResolver = () => [
    ...(hasPermissions.current && !isAdminDefault
      ? [
          {
            title: intl.formatMessage(messages.remove),
            onClick: (_event, _rowId, role) => {
              setConfirmDelete(() => () => removeRoles(fetchUuid, [role.uuid], removeRolesCallback));
              setDeleteInfo({
                title: intl.formatMessage(messages.removeRoleQuestion),
                confirmButtonLabel: intl.formatMessage(messages.removeRole),
                text: removeModalText(name, role.title, false),
              });
              setShowRemoveModal(true);
            },
          },
        ]
      : []),
  ];

  const toolbarButtons = () => [
    ...(hasPermissions.current && !isAdminDefault
      ? [
          <AppLink
            className={`rbac-m-hide-on-sm rbac-c-button__add-role${disableAddRoles && '-disabled'}`}
            to={pathnames['group-add-roles'].link.replace(':groupId', groupId)}
            key="add-to-group"
          >
            {addRoleButton(disableAddRoles, generateOuiaID(name || ''), isAdminDefault && intl.formatMessage(messages.defaultGroupNotManually))}
          </AppLink>,
          {
            label: intl.formatMessage(messages.addRole),
            props: {
              isDisabled: disableAddRoles,
              className: 'rbac-m-hide-on-md',
            },
            onClick: () => navigate(pathnames['group-add-roles'].link.replace(':groupId', groupId)),
          },
          {
            label: intl.formatMessage(messages.remove),
            props: {
              isDisabled: !selectedRoles || !selectedRoles.length > 0,
              variant: 'danger',
            },
            onClick: () => {
              const multipleRolesSelected = selectedRoles.length > 1;
              setConfirmDelete(
                () => () =>
                  removeRoles(
                    fetchUuid,
                    selectedRoles.map((role) => role.uuid),
                    removeRolesCallback,
                  ),
              );
              setDeleteInfo({
                title: intl.formatMessage(multipleRolesSelected ? messages.removeRolesQuestion : messages.removeRoleQuestion),
                confirmButtonLabel: intl.formatMessage(multipleRolesSelected ? messages.removeRoles : messages.removeRole),
                text: removeModalText(
                  name,
                  multipleRolesSelected ? selectedRoles.length : roles.find((role) => role.uuid === selectedRoles[0].uuid).name,
                  multipleRolesSelected,
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

      <Section type="content" id="tab-roles">
        <TableToolbarView
          columns={columns}
          isSelectable={hasPermissions.current && !isAdminDefault}
          rows={createRows(groupId, roles, selectedRoles)}
          data={roles}
          filterValue={filterValue}
          fetchData={(config) => {
            fetchGroupRoles(config)(fetchUuid);
          }}
          emptyFilters={{ name: '', description: '' }}
          setFilterValue={({ name, description }) => {
            typeof name !== 'undefined' && setFilterValue(name);
            typeof description !== 'undefined' && setDescriptionValue(description);
          }}
          isLoading={isLoading}
          pagination={pagination}
          checkedRows={selectedRoles}
          setCheckedItems={setCheckedItems}
          titlePlural={intl.formatMessage(messages.roles).toLowerCase()}
          titleSingular={intl.formatMessage(messages.role)}
          toolbarButtons={toolbarButtons}
          actionResolver={actionResolver}
          ouiaId="roles-table"
          emptyProps={{
            title: intl.formatMessage(messages.noGroupRoles),
            description: [intl.formatMessage(isAdminDefault ? messages.contactServiceTeamForRoles : messages.addRoleToConfigureAccess), ''],
          }}
          filters={[
            { key: 'name', value: filterValue },
            { key: 'description', value: descriptionValue },
          ]}
          tableId="group-roles"
        />
      </Section>
      <Suspense>
        <Outlet
          context={{
            [pathnames['group-roles-edit-group'].path]: {
              group,
              cancelRoute: pathnames['group-detail-roles'].link.replace(':groupId', groupId),
              postMethod: () => dispatch(fetchGroup(fetchUuid)),
            },
            [pathnames['group-roles-remove-group'].path]: {
              postMethod: () =>
                dispatch(
                  fetchGroups({
                    ...groupsPagination,
                    offset: 0,
                    filters: groupsFilters,
                    usesMetaInURL: true,
                    chrome,
                  }),
                ),
              cancelRoute: pathnames['group-detail-roles'].link.replace(':groupId', groupId),
              submitRoute: getBackRoute(pathnames.groups.link, { ...groupsPagination, offset: 0 }, groupsFilters),
              groupsUuid: [group],
            },
            [pathnames['group-add-roles'].path]: {
              afterSubmit: () => {
                if (isPlatformDefault || isAdminDefault) {
                  fetchSystGroup().then(({ value: { data } }) => {
                    fetchGroupRoles(pagination)(data[0].uuid);
                    fetchGroupData(data[0].uuid);
                  });
                } else {
                  fetchGroupRoles(pagination)(groupId);
                  fetchGroupData();
                }
              },
              fetchUuid: systemGroupUuid,
              selectedRoles: selectedAddRoles,
              setSelectedRoles: setSelectedAddRoles,
              closeUrl: pathnames['group-detail'].link.replace(':groupId', isPlatformDefault ? DEFAULT_ACCESS_GROUP_ID : groupId),
              addRolesToGroup: (groupId, roles, callback) => dispatch(reloadWrapper(addRolesToGroup(groupId, roles), callback)),
              groupName: group.name,
              isDefault: isPlatformDefault || isAdminDefault,
              isChanged,
              onDefaultGroupChanged,
            },
          }}
        />
      </Suspense>
    </React.Fragment>
  );
};

GroupRoles.propTypes = {
  searchFilter: PropTypes.string,
  selectedRoles: PropTypes.array,
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
    offset: PropTypes.number.isRequired,
    count: PropTypes.number,
  }),
  onDefaultGroupChanged: PropTypes.func,
};

GroupRoles.defaultProps = {
  pagination: defaultCompactSettings,
  selectedRoles: [],
};

export default GroupRoles;
