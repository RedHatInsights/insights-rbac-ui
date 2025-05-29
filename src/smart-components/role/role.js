import React, { Fragment, Suspense, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Outlet, useNavigationType, useParams } from 'react-router-dom';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { Button, Level, LevelItem, Text, TextContent } from '@patternfly/react-core';
import { Dropdown, DropdownItem, KebabToggle } from '@patternfly/react-core/deprecated';
import { PageHeaderTitle } from '@redhat-cloud-services/frontend-components/PageHeader';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { fetchRole, fetchRolesWithPolicies } from '../../redux/actions/role-actions';
import { TopToolbar } from '../../presentational-components/shared/top-toolbar';
import { fetchGroup, fetchRolesForGroup, fetchSystemGroup } from '../../redux/actions/group-actions';
import { ToolbarTitlePlaceholder } from '../../presentational-components/shared/loader-placeholders';
import { DEFAULT_ACCESS_GROUP_ID } from '../../utilities/constants';
import { BAD_UUID, getBackRoute } from '../../helpers/shared/helpers';
import useAppNavigate from '../../hooks/useAppNavigate';
import { defaultSettings } from '../../helpers/shared/pagination';
import Permissions from './role-permissions';
import EmptyWithAction from '../../presentational-components/shared/empty-state';
import RbacBreadcrumbs from '../../presentational-components/shared/breadcrumbs';
import AppLink, { mergeToBasename } from '../../presentational-components/shared/AppLink';
import pathnames from '../../utilities/pathnames';
import messages from '../../Messages';
import './role.scss';

const Role = ({ onDelete }) => {
  const intl = useIntl();
  const chrome = useChrome();
  const navigate = useAppNavigate();
  const navigationType = useNavigationType();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isNonPermissionAddingRole, setIsNonPermissionAddingRole] = useState(false);
  const { roleId, groupId } = useParams();
  const { role, group, isLoading, rolesPagination, rolesFilters, groupsPagination, groupsFilters, systemGroupUuid } = useSelector(
    (state) => ({
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

  const roleExists = useSelector((state) => {
    const {
      roleReducer: { error },
    } = state;
    return error !== BAD_UUID;
  });

  const groupExists = useSelector((state) => {
    const {
      groupReducer: { error },
    } = state;
    return error !== BAD_UUID;
  });

  const dispatch = useDispatch();
  const fetchData = () => {
    dispatch(fetchRole(roleId));
    if (groupId) {
      if (groupId !== DEFAULT_ACCESS_GROUP_ID) {
        dispatch(fetchGroup(groupId));
      } else {
        if (systemGroupUuid) {
          dispatch(fetchRolesForGroup(systemGroupUuid, {}));
          chrome.appObjectId(systemGroupUuid);
          return () => chrome.appObjectId(undefined);
        } else {
          dispatch(fetchSystemGroup({ chrome }));
        }
      }
    }
  };

  useEffect(() => {
    fetchData();
    chrome.appObjectId(roleId);
    return () => chrome.appObjectId(undefined);
  }, [roleId, groupId, systemGroupUuid]);

  useEffect(() => {
    if (role?.accessCount === 0 && role?.external_tenant !== '' && role?.external_role_id !== '' && role?.system) {
      setIsNonPermissionAddingRole(true);
    }
  }, [role]);

  const breadcrumbsList = () => [
    groupId
      ? {
          title: intl.formatMessage(messages.groups),
          to: getBackRoute(mergeToBasename(pathnames.groups.link), groupsPagination, groupsFilters),
        }
      : {
          title: intl.formatMessage(messages.roles),
          to: getBackRoute(mergeToBasename(pathnames.roles.link), rolesPagination, rolesFilters),
        },

    ...(groupExists && groupId && (groupId === DEFAULT_ACCESS_GROUP_ID ? systemGroupUuid : groupExists)
      ? group
        ? [
            {
              title: group && group.name,
              to: mergeToBasename(pathnames['group-detail-roles'].link).replace(':groupId', groupId),
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
        <AppLink onClick={() => setDropdownOpen(false)} to={pathnames['role-detail-edit'].link.replace(':roleId', roleId)}>
          {intl.formatMessage(messages.edit)}
        </AppLink>
      }
      key="edit-role"
    />,
    <DropdownItem
      component={
        <AppLink onClick={onDelete} to={pathnames['role-detail-remove'].link.replace(':roleId', roleId)}>
          {intl.formatMessage(messages.delete)}
        </AppLink>
      }
      className="rbac-c-role__action"
      key="delete-role"
    />,
  ];

  return (
    <Fragment>
      {(groupExists || !groupId) && roleExists ? (
        <Fragment>
          <TopToolbar breadcrumbs={breadcrumbsList()}>
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
          </TopToolbar>
          <Permissions cantAddPermissions={isNonPermissionAddingRole} isLoading={isLoading || !role} />
          <Suspense>
            <Outlet
              context={{
                [pathnames['role-detail-remove'].path]: {
                  afterSubmit: () => {
                    dispatch(fetchRolesWithPolicies({ ...rolesPagination, offset: 0, filters: rolesFilters, usesMetaInURL: true, chrome }));
                  },
                  cancelRoute: pathnames['role-detail'].link.replace(':roleId', roleId),
                  submitRoute: getBackRoute(pathnames['roles'].link, { ...rolesPagination, offset: 0 }, rolesFilters),
                  isLoading,
                },
                [pathnames['role-detail-edit'].path]: {
                  afterSubmit: fetchData,
                  cancelRoute: pathnames['role-detail'].link.replace(':roleId', roleId),
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
            <RbacBreadcrumbs {...breadcrumbsList()} />
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
                onClick={() => navigate(navigationType !== 'POP' ? -1 : pathnames.roles.link)}
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

Role.propTypes = {
  onDelete: PropTypes.func,
};

export default Role;
