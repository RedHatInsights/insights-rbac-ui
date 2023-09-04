import React, { useState, useEffect, Fragment, useContext, useRef, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FormattedMessage, useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Outlet, useParams } from 'react-router-dom';
import { Alert, Button, Tooltip } from '@patternfly/react-core';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import Section from '@redhat-cloud-services/frontend-components/Section';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';
import { defaultCompactSettings, defaultSettings } from '../../../helpers/shared/pagination';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import {
  addRolesToGroup,
  fetchRolesForGroup,
  fetchAddRolesForGroup,
  fetchSystemGroup,
  fetchGroup,
  fetchGroups,
} from '../../../redux/actions/group-actions';
import { getBackRoute, getDateFormat } from '../../../helpers/shared/helpers';
import PermissionsContext from '../../../utilities/permissions-context';
import AppLink from '../../../presentational-components/shared/AppLink';
import useAppNavigate from '../../../hooks/useAppNavigate';
import messages from '../../../Messages';
import pathnames from '../../../utilities/pathnames';
import './group-service-accounts.scss';

const createRows = (groupId, data, checkedRows = []) =>
  data?.reduce(
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
    []
  ) || [];

const reducer = ({ groupReducer: { selectedGroup, systemGroup, groups } }) => ({
  roles: selectedGroup.roles,
  pagination: selectedGroup.pagination || { ...defaultSettings, count: selectedGroup?.roles && selectedGroup.roles.length },
  groupsPagination: groups.pagination || groups.meta,
  groupsFilters: groups.filters,
  isLoading: !selectedGroup.loaded,
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

const GroupServiceAccounts = ({ onDefaultGroupChanged }) => {
  const intl = useIntl();
  const chrome = useChrome();
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const { groupId } = useParams();
  const [descriptionValue, setDescriptionValue] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedAddRoles, setSelectedAddRoles] = useState([]);
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
  const fetchGroupRoles = (config) => (groupId, options) => dispatch(fetchRolesForGroup(groupId, config, options));

  const columns = [
    { title: intl.formatMessage(messages.name), orderBy: 'name' },
    { title: intl.formatMessage(messages.description) },
    { title: intl.formatMessage(messages.lastModified) },
  ];

  useEffect(() => {
    if (groupId !== 'default-access') {
      fetchGroupRoles(pagination)(groupId);
    } else {
      systemGroupUuid && fetchGroupRoles(pagination)(systemGroupUuid);
    }
  }, [systemGroupUuid]);

  useEffect(() => {
    if (roles?.length > 0) {
      if (groupId !== 'default-access') {
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

  const actionResolver = () => [
    ...(hasPermissions.current && !isAdminDefault
      ? [
          {
            title: intl.formatMessage(messages.remove),
            onClick: () => {},
          },
        ]
      : []),
  ];

  const toolbarButtons = () => [
    <AppLink className="rbac-m-hide-on-sm" to={pathnames['group-add-service-account'].link.replace(':groupId', groupId)} key="add-to-group">
      <Button ouiaId="add-service-account-button" variant="primary" className="rbac-m-hide-on-sm" aria-label="Add service account">
        {intl.formatMessage(messages.addServiceAccount)}
      </Button>
    </AppLink>,
    {
      label: intl.formatMessage(messages.addServiceAccount),
      props: {
        className: 'rbac-m-hide-on-md',
      },
      onClick: () => navigate(pathnames['group-add-service-account'].link.replace(':groupId', groupId)),
    },
  ];
  return (
    <React.Fragment>
      <Section type="content" id="tab-service-accounts">
        <Alert
          className="rbac-service-accounts-alert"
          variant="info"
          isInline
          isPlain
          title={
            <FormattedMessage
              id="visitServiceAccountsPage"
              defaultMessage="To add, reset credentials, or delete service accounts visit the {link}."
              values={{
                link: (
                  <AppLink to="/service-accounts" linkBasename="/iam">
                    {intl.formatMessage(messages.serviceAccountsPage)}
                  </AppLink>
                ),
              }}
            />
          }
        />
        <TableToolbarView
          columns={columns}
          isSelectable={hasPermissions.current && !isAdminDefault}
          rows={createRows(groupId, roles, selectedRoles)}
          data={roles}
          filterValue={filterValue}
          fetchData={(config) => {
            fetchGroupRoles(config)(groupId);
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
              postMethod: () => dispatch(fetchGroup(groupId)),
            },
            [pathnames['group-roles-remove-group'].path]: {
              postMethod: () => dispatch(fetchGroups({ ...groupsPagination, offset: 0, filters: groupsFilters, usesMetaInURL: true, chrome })),
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
              closeUrl: pathnames['group-detail'].link.replace(':groupId', isPlatformDefault ? 'default-access' : groupId),
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

GroupServiceAccounts.propTypes = {
  searchFilter: PropTypes.string,
  selectedRoles: PropTypes.array,
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
    offset: PropTypes.number.isRequired,
    count: PropTypes.number,
  }),
  onDefaultGroupChanged: PropTypes.func,
};

GroupServiceAccounts.defaultProps = {
  pagination: defaultCompactSettings,
  selectedRoles: [],
};

export default GroupServiceAccounts;
