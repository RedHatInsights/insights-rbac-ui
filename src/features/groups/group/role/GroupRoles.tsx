import React, { Fragment, Suspense, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { Outlet, useParams } from 'react-router-dom';
import { Button, Tooltip } from '@patternfly/react-core';
import Section from '@redhat-cloud-services/frontend-components/Section';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';
import { defaultSettings } from '../../../../helpers/pagination';
import { TableToolbarView } from '../../../../components/tables/TableToolbarView';
import { fetchAddRolesForGroup, fetchRolesForGroup, removeRolesFromGroup } from '../../../../redux/groups/actions';
import { getBackRoute } from '../../../../helpers/navigation';
import { getDateFormat } from '../../../../helpers/stringUtilities';
import PermissionsContext from '../../../../utilities/permissionsContext';
import { AppLink } from '../../../../components/navigation/AppLink';
import useAppNavigate from '../../../../hooks/useAppNavigate';
import { DEFAULT_ACCESS_GROUP_ID } from '../../../../utilities/constants';
import messages from '../../../../Messages';
import pathnames from '../../../../utilities/pathnames';
import type { GroupRolesProps, Role } from './types';
import './group-roles.scss';

const createRows = (groupId: string, roles: Role[], checkedRows: Role[] = []) =>
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
          description || '',
          <Fragment key={`${uuid}-modified`}>
            <DateFormat date={modified} type={getDateFormat(modified)} />
          </Fragment>,
        ],
        selected: Boolean(checkedRows && checkedRows.find((row) => row.uuid === uuid)),
      },
    ],
    [] as any[],
  ) || [];

const generateOuiaID = (name: string) => {
  // given a group name, generate an OUIA ID for the 'Add role' button
  return name.toLowerCase().includes('default access') ? 'dag-add-role-button' : 'add-role-button';
};

const addRoleButton = (isDisabled: boolean, ouiaId: string, customTooltipText?: string) => {
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

const reducer = ({ groupReducer }: any) => {
  const { selectedGroup, systemGroup, groups } = groupReducer;
  return {
    roles: selectedGroup?.roles?.data || [],
    pagination: { ...defaultSettings, ...(selectedGroup?.roles?.meta || {}) },
    groupsPagination: groups?.pagination || groups?.meta,
    groupsFilters: groups?.filters,
    isLoading: selectedGroup?.roles?.isLoading || false,
    isPlatformDefault: selectedGroup?.platform_default || false,
    isAdminDefault: selectedGroup?.admin_default || false,
    isChanged: !selectedGroup?.system,
    disableAddRoles:
      /**
       * First validate if the pagination object exists and is not empty.
       * If empty or undefined, the disable condition will be always true
       */
      Object.keys(selectedGroup?.addRoles?.pagination || {}).length > 0
        ? !(selectedGroup.addRoles.pagination && selectedGroup.addRoles.pagination.count > 0) || !!selectedGroup.admin_default
        : !!selectedGroup.admin_default,
    systemGroupUuid: systemGroup?.uuid,
    group: selectedGroup,
  };
};

export const GroupRoles: React.FC<GroupRolesProps> = ({ onDefaultGroupChanged }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const [filterValue, setFilterValue] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const { userAccessAdministrator, orgAdmin } = useContext(PermissionsContext);
  const hasPermissions = useRef(orgAdmin || userAccessAdministrator);
  const { roles, pagination, isLoading, isPlatformDefault, isChanged, disableAddRoles, systemGroupUuid, group } = useSelector(reducer);

  const columns = [
    { title: intl.formatMessage(messages.name), transforms: [] },
    { title: intl.formatMessage(messages.description) },
    { title: intl.formatMessage(messages.lastModified) },
  ];

  const fetchGroupRoles = useCallback((groupId: string, options: any) => dispatch(fetchRolesForGroup(groupId, options)), [dispatch]);

  const fetchData = useCallback(
    (apiProps: any = {}) => {
      const actualGroupId = groupId !== DEFAULT_ACCESS_GROUP_ID ? groupId! : systemGroupUuid;
      if (actualGroupId) {
        fetchGroupRoles(actualGroupId, {
          limit: 50,
          offset: 0,
          orderBy: 'display_name',
          ...pagination,
          ...apiProps,
        });
      }
    },
    [fetchGroupRoles, groupId, pagination, systemGroupUuid],
  );

  useEffect(() => {
    fetchData();
  }, [systemGroupUuid]);

  useEffect(() => {
    hasPermissions.current = orgAdmin || userAccessAdministrator;
  }, [orgAdmin, userAccessAdministrator]);

  useEffect(() => {
    if (isChanged && onDefaultGroupChanged) {
      onDefaultGroupChanged(group);
    }
  }, [isChanged, group, onDefaultGroupChanged]);

  const actionResolver = ({ uuid }: Role) => [
    ...(hasPermissions.current && isPlatformDefault
      ? []
      : [
          {
            title: intl.formatMessage(messages.remove),
            onClick: () =>
              navigate({
                pathname: pathnames['group-remove-role'].link.replace(':groupId', groupId!).replace(':roleId', uuid),
                search: `?pagination=${pagination?.limit || defaultSettings.limit}-${pagination?.offset || defaultSettings.offset}`,
              }),
          },
        ]),
  ];

  const toolbarButtons = () => {
    const buttons: any[] = [];

    if (hasPermissions.current && !isPlatformDefault) {
      buttons.push(
        <AppLink className="rbac-m-hide-on-sm" to={pathnames['group-add-roles'].link.replace(':groupId', groupId!)} key="add-to-group">
          {addRoleButton(disableAddRoles, generateOuiaID(group?.name || ''))}
        </AppLink>,
      );

      if (selectedRoles.length > 0) {
        buttons.push({
          label: intl.formatMessage(messages.remove),
          props: {
            isDisabled: false,
          },
          onClick: () => {
            const roleIds = selectedRoles.map(({ uuid }) => uuid);
            dispatch(removeRolesFromGroup(groupId!, roleIds));
            setSelectedRoles([]);
            fetchData();
          },
        });
      }

      buttons.push({
        label: intl.formatMessage(messages.addRole),
        props: {
          className: 'rbac-m-hide-on-md',
          isDisabled: disableAddRoles,
        },
        onClick: () => navigate(pathnames['group-add-roles'].link.replace(':groupId', groupId!)),
      });
    }

    return buttons;
  };

  return (
    <Fragment>
      <Section type="content" id="tab-roles">
        <TableToolbarView
          columns={columns}
          isSelectable={hasPermissions.current && !isPlatformDefault}
          rows={createRows(groupId!, roles, selectedRoles)}
          data={roles}
          filterValue={filterValue as any}
          fetchData={(config: any) => fetchData(config)}
          setFilterValue={setFilterValue}
          isLoading={isLoading}
          pagination={pagination}
          checkedRows={selectedRoles}
          setCheckedItems={setSelectedRoles}
          titlePlural={intl.formatMessage(messages.roles).toLowerCase()}
          titleSingular={intl.formatMessage(messages.role)}
          toolbarButtons={toolbarButtons as any}
          actionResolver={actionResolver}
          emptyProps={{
            title: intl.formatMessage(messages.noGroupRoles),
            description: [intl.formatMessage(isPlatformDefault ? messages.contactServiceTeamForRoles : messages.addRoleToThisGroup), ''],
          }}
          isFilterable
          tableId="group-roles"
          ouiaId="group-roles"
          routes={() => null}
          filters={[
            {
              key: 'name',
              value: filterValue,
              label: intl.formatMessage(messages.name),
              placeholder: intl.formatMessage(messages.filterByKey, {
                key: intl.formatMessage(messages.name).toLowerCase(),
              }),
            },
          ]}
        />
      </Section>

      {!isPlatformDefault ? (
        <Suspense>
          <Outlet
            context={{
              [pathnames['group-add-roles'].path]: {
                postMethod: (promise: Promise<any>) => {
                  navigate(pathnames['group-detail-roles'].link.replace(':groupId', groupId!));
                  if (promise) {
                    promise.then(() => {
                      dispatch(fetchAddRolesForGroup(groupId!, { limit: 20, offset: 0 }));
                      fetchData();
                    });
                  }
                },
              },
              [pathnames['group-remove-role'].path]: {
                postMethod: (promise: Promise<any>) => {
                  const backRoute = getBackRoute(pathnames['group-detail-roles'].link.replace(':groupId', groupId!), pagination, {});
                  navigate(backRoute);
                  if (promise) {
                    promise.then(() => {
                      dispatch(fetchAddRolesForGroup(groupId!, { limit: 20, offset: 0 }));
                      fetchData();
                    });
                  }
                },
              },
            }}
          />
        </Suspense>
      ) : null}
    </Fragment>
  );
};
