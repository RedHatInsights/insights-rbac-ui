import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { Button, Dropdown, DropdownItem, KebabToggle, Level, LevelItem, Text, TextContent } from '@patternfly/react-core';
import { PageHeaderTitle } from '@redhat-cloud-services/frontend-components/PageHeader';
import pathnames from '../../utilities/pathnames';
import { fetchRole, fetchRolesWithPolicies } from '../../redux/actions/role-actions';
import { TopToolbar } from '../../presentational-components/shared/top-toolbar';
import { ListLoader } from '../../presentational-components/shared/loader-placeholders';
import Permissions from './role-permissions';
import { fetchGroup, fetchSystemGroup } from '../../redux/actions/group-actions';
import { ToolbarTitlePlaceholder } from '../../presentational-components/shared/loader-placeholders';
import RemoveRoleModal from './remove-role-modal';
import EditRoleModal from './edit-role-modal';
import EmptyWithAction from '../../presentational-components/shared/empty-state';
import RbacBreadcrumbs from '../../presentational-components/shared/breadcrubms';
import { BAD_UUID, getBackRoute } from '../../helpers/shared/helpers';
import { defaultSettings } from '../../helpers/shared/pagination';
import './role.scss';

const Role = ({ onDelete }) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const { uuid, groupUuid } = useParams();
  const { role, group, isRecordLoading, rolesPagination, rolesFilters, groupsPagination, groupsFilters, systemGroupUuid } = useSelector(
    (state) => ({
      role: state.roleReducer.selectedRole,
      isRecordLoading: state.roleReducer.isRecordLoading,
      ...(groupUuid && { group: state.groupReducer.selectedGroup }),
      systemGroupUuid: state.groupReducer.systemGroup?.uuid,
      rolesPagination: state.roleReducer?.roles?.pagination || defaultSettings,
      rolesFilters: state.roleReducer?.roles?.filters || {},
      groupsPagination: state.groupReducer?.groups?.pagination || defaultSettings,
      groupsFilters: state.groupReducer?.groups?.filters || {},
    }),
    shallowEqual
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
    dispatch(fetchRole(uuid));
    if (groupUuid) {
      if (groupUuid !== 'default-access') {
        dispatch(fetchGroup(groupUuid));
      } else {
        if (systemGroupUuid) {
          fetchData(systemGroupUuid);
          insights.chrome.appObjectId(systemGroupUuid);
          return () => insights.chrome.appObjectId(undefined);
        } else {
          dispatch(fetchSystemGroup());
        }
      }
    }
  };

  useEffect(() => {
    fetchData();
    insights.chrome.appObjectId(uuid);
    return () => insights.chrome.appObjectId(undefined);
  }, [uuid, groupUuid, systemGroupUuid]);

  const breadcrumbsList = () => [
    groupUuid
      ? {
          title: 'Groups',
          to: getBackRoute(`/settings/rbac/groups`, groupsPagination, groupsFilters),
        }
      : {
          title: 'Roles',
          to: getBackRoute('/settings/rbac/roles', rolesPagination, rolesFilters),
        },

    ...(groupExists && groupUuid && (groupUuid === 'default-access' ? systemGroupUuid : groupExists)
      ? group
        ? [
            {
              title: group && group.name,
              to: `detail/${groupUuid}/roles`,
              isLoading: group && group.loaded,
            },
          ]
        : [undefined]
      : groupExists || !groupUuid
      ? []
      : [{ title: 'Invalid group', isActive: true }]),

    ...(groupExists || !groupUuid
      ? [
          {
            title: isRecordLoading ? undefined : roleExists ? role?.display_name || role?.name : 'Invalid role',
            isActive: true,
          },
        ]
      : []),
  ];

  const title = !isRecordLoading && role ? role.display_name || role.name : undefined;
  const description = !isRecordLoading && role ? role.description : undefined;
  const dropdownItems = [
    <DropdownItem
      component={
        <Link onClick={() => setDropdownOpen(false)} to="edit">
          Edit
        </Link>
      }
      key="edit-role"
    />,
    <DropdownItem
      component={
        <Link onClick={onDelete} to={pathnames['role-detail-remove'].path.replace(':id', uuid)}>
          Delete
        </Link>
      }
      className="rbac-c-role__action"
      key="delete-role"
    />,
  ];

  return (
    <Fragment>
      {(groupExists || !groupUuid) && roleExists ? (
        <Fragment>
          <TopToolbar breadcrumbs={breadcrumbsList()}>
            <Level>
              <LevelItem>
                <PageHeaderTitle title={title || <ToolbarTitlePlaceholder />} className="rbac-page-header__title" />
              </LevelItem>
              {!isRecordLoading && role && !role.system && (
                <LevelItem>
                  <Dropdown
                    ouiaId="role-title-actions-dropdown"
                    toggle={<KebabToggle onToggle={(isOpen) => setDropdownOpen(isOpen)} id="role-actions-dropdown" />}
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
          {isRecordLoading || !role ? <ListLoader /> : <Permissions />}
          <Routes>
            <Route
              path={pathnames['role-detail-remove'].path}
              element={
                <>
                  {!isRecordLoading && (
                    <RemoveRoleModal
                      afterSubmit={() => {
                        dispatch(fetchRolesWithPolicies({ ...rolesPagination, offset: 0, filters: rolesFilters, inModal: false }));
                      }}
                      cancelRoute={pathnames['role-detail'].path.replace(':uuid', uuid)}
                      submitRoute={getBackRoute(pathnames.roles.path, { ...rolesPagination, offset: 0 }, rolesFilters)}
                      routeMatch={pathnames['role-detail-remove'].path}
                    />
                  )}
                </>
              }
            />
            <Route path="edit" element={<>{!isRecordLoading && <EditRoleModal afterSubmit={fetchData} cancelRoute="../" />}</>} />
          </Routes>
        </Fragment>
      ) : (
        <Fragment>
          <section className="pf-c-page__main-breadcrumb pf-u-pb-md">
            <RbacBreadcrumbs {...breadcrumbsList()} />
          </section>
          <EmptyWithAction
            title={`${groupExists ? 'Role' : 'Group'} not found`}
            description={[`${groupExists ? 'Role' : 'Group'} with ID ${groupExists ? uuid : groupUuid} does not exist.`]}
            actions={[
              <Button
                key="back-button"
                className="pf-u-mt-xl"
                ouiaId="back-button"
                variant="primary"
                aria-label="Back to previous page"
                onClick={() => navigate(-1)}
              >
                Back to previous page
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
