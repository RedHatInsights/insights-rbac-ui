import React, { Fragment, Suspense, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Outlet, useNavigationType, useParams } from 'react-router-dom';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Level } from '@patternfly/react-core';
import { LevelItem } from '@patternfly/react-core';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';
import { Dropdown, DropdownItem, KebabToggle } from '@patternfly/react-core/deprecated';
import NotAuthorized from '@patternfly/react-component-groups/dist/dynamic/NotAuthorized';
import { PageHeaderTitle } from '@redhat-cloud-services/frontend-components/PageHeader';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { fetchRole, fetchRolesWithPolicies } from '../../../../redux/roles/actions';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { fetchGroup, fetchRolesForGroup, fetchSystemGroup } from '../../../../redux/groups/actions';
import { ToolbarTitlePlaceholder } from '../../../../components/ui-states/LoaderPlaceholders';
import { DEFAULT_ACCESS_GROUP_ID } from '../../../../utilities/constants';
import { BAD_UUID } from '../../../../helpers/dataUtilities';
import { getBackRoute } from '../../../../helpers/navigation';
import useAppNavigate from '../../../../hooks/useAppNavigate';
import { defaultSettings } from '../../../../helpers/pagination';
import useUserData from '../../../../hooks/useUserData';
import Permissions from './RolePermissions';
import { EmptyWithAction } from '../../../../components/ui-states/EmptyState';
import { RbacBreadcrumbs } from '../../../../components/navigation/Breadcrumbs';
import { AppLink } from '../../../../components/navigation/AppLink';
import { useAppLink } from '../../../../hooks/useAppLink';
import pathnames from '../../../../utilities/pathnames';
import messages from '../../../../Messages';
import type { RBACStore } from '../../../../redux/store.d';
import '../../role.scss';

interface RoleLegacyProps {
  onDelete?: () => void;
}

const RoleLegacy: React.FC<RoleLegacyProps> = ({ onDelete }) => {
  const intl = useIntl();
  const chrome = useChrome();
  const navigate = useAppNavigate();
  const navigationType = useNavigationType();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isNonPermissionAddingRole, setIsNonPermissionAddingRole] = useState(false);
  const { roleId, groupId } = useParams<{ roleId: string; groupId?: string }>();
  const { orgAdmin, userAccessAdministrator } = useUserData();
  const { role, group, isLoading, rolesPagination, rolesFilters, groupsPagination, groupsFilters, systemGroupUuid } = useSelector(
    (state: RBACStore) => ({
      role: state.roleReducer.selectedRole,
      isLoading: state.roleReducer.isRecordLoading,
      ...(groupId && { group: state.groupReducer.selectedGroup }),
      systemGroupUuid: state.groupReducer.systemGroup?.uuid,
      rolesPagination: state.roleReducer?.roles?.pagination || defaultSettings,
      rolesFilters: state.roleReducer?.roles?.filters || {},
      groupsPagination: state.groupReducer?.groups?.pagination || defaultSettings,
      groupsFilters: state.groupReducer?.groups?.filters || {},
    }),
    shallowEqual,
  );

  const roleExists = useSelector((state: RBACStore) => {
    const {
      roleReducer: { error },
    } = state;
    return error !== BAD_UUID;
  });

  const groupExists = useSelector((state: RBACStore) => {
    const {
      groupReducer: { error },
    } = state;
    return error !== BAD_UUID;
  });

  const dispatch = useDispatch();
  const toAppLink = useAppLink();
  const fetchData = () => {
    dispatch(fetchRole(roleId!) as unknown as { type: string });
    if (groupId) {
      if (groupId !== DEFAULT_ACCESS_GROUP_ID) {
        dispatch(fetchGroup(groupId) as unknown as { type: string });
      } else {
        if (systemGroupUuid) {
          dispatch(fetchRolesForGroup(systemGroupUuid, {}) as unknown as { type: string });
          chrome.appObjectId(systemGroupUuid);
          return () => chrome.appObjectId(undefined as unknown as string);
        } else {
          dispatch(fetchSystemGroup({ chrome }) as unknown as { type: string });
        }
      }
    }
  };

  useEffect(() => {
    fetchData();
    chrome.appObjectId(roleId as string);
    return () => chrome.appObjectId(undefined as unknown as string);
  }, [roleId, groupId, systemGroupUuid]);

  useEffect(() => {
    // Disable for system roles
    const isSystemRole = role?.system;

    // Disable for preconfigured roles when user is Org Admin or User Access Admin
    const isPreconfiguredRoleForAdmin = (orgAdmin || userAccessAdministrator) && (role?.platform_default || role?.admin_default);

    if (isSystemRole || isPreconfiguredRoleForAdmin) {
      setIsNonPermissionAddingRole(true);
    } else {
      setIsNonPermissionAddingRole(false);
    }
  }, [role, orgAdmin, userAccessAdministrator]);

  const breadcrumbsList = () => [
    groupId
      ? {
          title: intl.formatMessage(messages.groups),
          to: getBackRoute(
            toAppLink(pathnames.groups.link) as string,
            groupsPagination as { limit: number; offset: number },
            groupsFilters,
          ) as unknown as string,
        }
      : {
          title: intl.formatMessage(messages.roles),
          to: getBackRoute(
            toAppLink(pathnames.roles.link) as string,
            rolesPagination as { limit: number; offset: number },
            rolesFilters,
          ) as unknown as string,
        },

    ...(groupExists && groupId && (groupId === DEFAULT_ACCESS_GROUP_ID ? systemGroupUuid : groupExists)
      ? group
        ? [
            {
              title: group && group.name,
              to: (toAppLink(pathnames['group-detail-roles'].link) as string).replace(':groupId', groupId),
              isLoading: group && group.loaded,
            },
          ]
        : [undefined]
      : groupExists || !groupId
        ? []
        : [{ title: intl.formatMessage(messages.invalidGroup), isActive: true }]),

    ...(groupExists || !groupId
      ? [
          {
            title: isLoading ? undefined : roleExists ? role?.display_name || role?.name : intl.formatMessage(messages.invalidRole),
            isActive: true,
          },
        ]
      : []),
  ];

  const title = !isLoading && role ? role.display_name || role.name : undefined;
  const description = !isLoading && role ? role.description : undefined;
  const dropdownItems = [
    <DropdownItem
      component={
        <AppLink onClick={() => setDropdownOpen(false)} to={pathnames['role-detail-edit'].link.replace(':roleId', roleId!)}>
          {intl.formatMessage(messages.edit)}
        </AppLink>
      }
      key="edit-role"
    />,
    <DropdownItem
      component={
        <AppLink onClick={onDelete} to={pathnames['role-detail-remove'].link.replace(':roleId', roleId!)}>
          {intl.formatMessage(messages.delete)}
        </AppLink>
      }
      className="rbac-c-role__action"
      key="delete-role"
    />,
  ];

  // Show NotAuthorized component for users without proper permissions
  if (!orgAdmin && !userAccessAdministrator) {
    return (
      <NotAuthorized
        serviceName="User Access Administration"
        description="You need User Access Administrator or Organization Administrator permissions to view roles."
      />
    );
  }

  return (
    <Fragment>
      {(groupExists || !groupId) && roleExists ? (
        <Fragment>
          <PageLayout breadcrumbs={breadcrumbsList() as Parameters<typeof PageLayout>[0]['breadcrumbs']}>
            <Level>
              <LevelItem>
                <PageHeaderTitle title={title || <ToolbarTitlePlaceholder />} className="rbac-page-header__title" />
              </LevelItem>
              {!isLoading && role && !role.system && (
                <LevelItem>
                  <Dropdown
                    ouiaId="role-title-actions-dropdown"
                    toggle={<KebabToggle onToggle={(_event, isOpen) => setDropdownOpen(isOpen)} id="role-actions-dropdown" />}
                    isOpen={isDropdownOpen}
                    isPlain
                    position="right"
                    dropdownItems={dropdownItems}
                  />
                </LevelItem>
              )}
            </Level>
            {description && (
              <TextContent className="rbac-page-header__description">
                <Text component="p">{description}</Text>
              </TextContent>
            )}
          </PageLayout>
          <Permissions cantAddPermissions={isNonPermissionAddingRole} isLoading={isLoading || !role} />
          <Suspense>
            <Outlet
              context={{
                [pathnames['role-detail-remove'].path]: {
                  afterSubmit: () => {
                    dispatch(
                      fetchRolesWithPolicies({
                        ...rolesPagination,
                        offset: 0,
                        filters: rolesFilters,
                        usesMetaInURL: true,
                        chrome,
                      }) as unknown as { type: string },
                    );
                  },
                  cancelRoute: pathnames['role-detail'].link.replace(':roleId', roleId!),
                  submitRoute: getBackRoute(
                    pathnames['roles'].link,
                    { ...(rolesPagination as { limit: number; offset: number }), offset: 0 },
                    rolesFilters,
                  ),
                  isLoading,
                },
                [pathnames['role-detail-edit'].path]: {
                  afterSubmit: fetchData,
                  cancelRoute: pathnames['role-detail'].link.replace(':roleId', roleId!),
                  isLoading,
                },
                [pathnames['role-add-permission'].path]: {
                  isOpen: true,
                  role,
                },
              }}
            />
          </Suspense>
        </Fragment>
      ) : (
        <Fragment>
          <section className="pf-v5-c-page__main-breadcrumb pf-v5-u-pb-md">
            <RbacBreadcrumbs breadcrumbs={breadcrumbsList() as Parameters<typeof RbacBreadcrumbs>[0]['breadcrumbs']} />
          </section>
          <EmptyWithAction
            title={`${groupExists ? 'Role' : 'Group'} not found`}
            description={[`${groupExists ? 'Role' : 'Group'} with ID ${groupExists ? roleId : groupId} does not exist.`]}
            actions={[
              <Button
                key="back-button"
                className="pf-v5-u-mt-xl"
                ouiaId="back-button"
                variant="primary"
                aria-label="Back to previous page"
                onClick={() => navigate(navigationType !== 'POP' ? (-1 as unknown as string) : pathnames.roles.link)}
              >
                {intl.formatMessage(messages.backToPreviousPage)}
              </Button>,
            ]}
          />
        </Fragment>
      )}
    </Fragment>
  );
};

// Feature component (used by Routing.tsx) - both named and default exports
export { RoleLegacy };
export default RoleLegacy;
