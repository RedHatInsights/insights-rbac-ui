import React, { useState, useEffect, useContext, useRef, Suspense, Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { Outlet, useParams } from 'react-router-dom';
import { Alert, Button } from '@patternfly/react-core';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import Section from '@redhat-cloud-services/frontend-components/Section';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';
import { defaultSettings } from '../../../helpers/shared/pagination';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { fetchGroup, fetchGroups } from '../../../redux/actions/group-actions';
import { fetchServiceAccountsForGroup } from '../../../redux/actions/group-actions';
import { getBackRoute, getDateFormat } from '../../../helpers/shared/helpers';
import { DEFAULT_ACCESS_GROUP_ID } from '../../../utilities/constants';
import PermissionsContext from '../../../utilities/permissions-context';
import AppLink from '../../../presentational-components/shared/AppLink';
import useAppNavigate from '../../../hooks/useAppNavigate';
import messages from '../../../Messages';
import pathnames from '../../../utilities/pathnames';
import './group-service-accounts.scss';

const createRows = (data = [], checkedRows = []) =>
  data?.reduce(
    (acc, { uuid, name, clientID, owner, time_created: timeCreated }) => [
      ...acc,
      {
        uuid,
        title: name,
        cells: [
          name,
          clientID,
          owner,
          <Fragment key={`${name}-modified`}>
            <DateFormat date={timeCreated} type={getDateFormat(timeCreated)} />
          </Fragment>,
        ],
        selected: Boolean(checkedRows && checkedRows.find((row) => row.uuid === uuid)),
      },
    ],
    []
  );

const reducer = ({ groupReducer: { selectedGroup, systemGroup, groups } }) => ({
  serviceAccounts: selectedGroup.serviceAccounts?.data || [],
  pagination: { ...defaultSettings, ...(selectedGroup?.serviceAccounts?.meta || {}) },
  groupsPagination: groups.pagination || groups.meta,
  groupsFilters: groups.filters,
  isLoading: selectedGroup.serviceAccounts.isLoading,
  isAdminDefault: selectedGroup.admin_default,
  systemGroupUuid: systemGroup?.uuid,
  group: selectedGroup,
});

const GroupServiceAccounts = () => {
  const intl = useIntl();
  const chrome = useChrome();
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const { groupId } = useParams();
  const [descriptionValue, setDescriptionValue] = useState('');
  const [ownerValue, setOwnerValue] = useState('');
  const [timeCreatedValue, setTimeCreatedValue] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const { userAccessAdministrator, orgAdmin } = useContext(PermissionsContext);
  const hasPermissions = useRef(orgAdmin || userAccessAdministrator);
  const { serviceAccounts, pagination, groupsPagination, groupsFilters, isLoading, group, isAdminDefault, systemGroupUuid } = useSelector(reducer);

  const fetchGroupAccounts = (groupId, options) => dispatch(fetchServiceAccountsForGroup(groupId, options));

  const columns = [
    { title: intl.formatMessage(messages.description), orderBy: 'description' },
    { title: intl.formatMessage(messages.clientId), orderBy: 'clientID' },
    { title: intl.formatMessage(messages.owner), orderBy: 'owner' },
    { title: intl.formatMessage(messages.timeCreated), orderBy: 'timeCreated' },
  ];

  useEffect(() => {
    if (groupId !== DEFAULT_ACCESS_GROUP_ID) {
      fetchGroupAccounts(groupId, pagination);
    } else {
      systemGroupUuid && fetchGroupAccounts(systemGroupUuid, pagination);
    }
  }, [systemGroupUuid]);

  useEffect(() => {
    hasPermissions.current = orgAdmin || userAccessAdministrator;
  }, [orgAdmin, userAccessAdministrator]);

  const actionResolver = () => [
    ...(hasPermissions.current && !isAdminDefault
      ? [
          {
            title: intl.formatMessage(messages.remove),
            onClick: () => null, // TODO: add service account removal
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
          title={intl.formatMessage(messages.visitServiceAccountsPage, {
            link: (
              <AppLink to="/service-accounts" linkBasename="/iam">
                {intl.formatMessage(messages.serviceAccountsPage)}
              </AppLink>
            ),
          })}
        />
        <TableToolbarView
          columns={columns}
          isSelectable
          rows={createRows(serviceAccounts, selectedAccounts)}
          data={serviceAccounts}
          filterValue={descriptionValue}
          fetchData={(config) => {
            fetchGroupAccounts(groupId, config);
          }}
          emptyFilters={{ owner: '', description: '', timeCreated: '' }}
          setFilterValue={({ name, description }) => {
            typeof name !== 'undefined' && setOwnerValue(name);
            typeof description !== 'undefined' && setDescriptionValue(description);
            typeof timeCreatedValue !== 'undefined' && setTimeCreatedValue(description);
          }}
          isLoading={isLoading}
          pagination={pagination}
          checkedRows={selectedAccounts}
          setCheckedItems={setSelectedAccounts}
          titlePlural={intl.formatMessage(messages.serviceAccounts).toLowerCase()}
          titleSingular={intl.formatMessage(messages.serviceAccount)}
          toolbarButtons={toolbarButtons}
          actionResolver={actionResolver}
          emptyProps={{
            title: intl.formatMessage(messages.noGroupAccounts),
            description: [intl.formatMessage(isAdminDefault ? messages.contactServiceTeamForAccounts : messages.addAccountsToThisGroup), ''],
          }}
          filters={[
            { key: 'description', value: descriptionValue },
            { key: 'owner', value: ownerValue },
          ]}
          tableId="group-accounts"
          ouiaId="group-accounts"
        />
      </Section>
      <Suspense>
        <Outlet
          context={{
            [pathnames['group-service-accounts-edit-group'].path]: {
              group,
              cancelRoute: pathnames['group-detail-service-accounts'].link.replace(':groupId', groupId),
              postMethod: () => dispatch(fetchGroup(groupId)),
            },
            [pathnames['group-service-accounts-remove-group'].path]: {
              postMethod: () => dispatch(fetchGroups({ ...groupsPagination, offset: 0, filters: groupsFilters, usesMetaInURL: true, chrome })),
              cancelRoute: pathnames['group-detail-service-accounts'].link.replace(':groupId', groupId),
              submitRoute: getBackRoute(pathnames.groups.link, { ...groupsPagination, offset: 0 }, groupsFilters),
              groupsUuid: [group],
            },
            [pathnames['group-add-service-account'].path]: {
              cancelRoute: pathnames['group-detail-service-accounts'].link.replace(':groupId', groupId),
              submitRoute: pathnames['group-detail-service-accounts'].link.replace(':groupId', groupId),
            },
          }}
        />
      </Suspense>
    </React.Fragment>
  );
};

export default GroupServiceAccounts;
