import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, Route, useParams } from 'react-router-dom';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { Dropdown, DropdownItem, KebabToggle, Level, LevelItem, Text, TextContent } from '@patternfly/react-core';
import { PageHeaderTitle } from '@redhat-cloud-services/frontend-components/components/PageHeader';
import { routes } from '../../../package.json';
import { fetchRole, fetchRolesWithPolicies } from '../../redux/actions/role-actions';
import { TopToolbar } from '../../presentational-components/shared/top-toolbar';
import { ListLoader } from '../../presentational-components/shared/loader-placeholders';
import Permissions from './role-permissions';
import { fetchGroup } from '../../redux/actions/group-actions';
import { ToolbarTitlePlaceholder } from '../../presentational-components/shared/loader-placeholders';
import RemoveRoleModal from './remove-role-modal';
import EditRoleModal from './edit-role-modal';
import './role.scss';

const Role = ({ onDelete }) => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const { uuid, groupUuid } = useParams();
  const { role, group, isRecordLoading } = useSelector(
    (state) => ({
      role: state.roleReducer.selectedRole,
      isRecordLoading: state.roleReducer.isRecordLoading,
      ...(groupUuid && { group: state.groupReducer.selectedGroup }),
    }),
    shallowEqual
  );
  const dispatch = useDispatch();
  const fetchData = () => {
    dispatch(fetchRole(uuid));
    groupUuid && dispatch(fetchGroup(groupUuid));
  };

  useEffect(() => {
    fetchData();
    insights.chrome.appObjectId(uuid);
    return () => insights.chrome.appObjectId(undefined);
  }, [uuid, groupUuid]);

  const title = !isRecordLoading && role ? role.display_name || role.name : undefined;
  const description = !isRecordLoading && role ? role.description : undefined;
  const dropdownItems = [
    <DropdownItem component={<Link to={routes['role-detail-edit'].replace(':id', uuid)}>Edit</Link>} key="edit-role" />,
    <DropdownItem
      component={
        <Link onClick={onDelete} to={routes['role-detail-remove'].replace(':id', uuid)}>
          Delete
        </Link>
      }
      className="ins-c-role__action"
      key="delete-role"
    />,
  ];

  return (
    <Fragment>
      <TopToolbar
        breadcrumbs={[
          ...[groupUuid ? { title: 'Groups', to: '/groups' } : { title: 'Roles', to: '/roles' }],
          ...(groupUuid
            ? [
                {
                  title: group && group.name,
                  to: `/groups/detail/${groupUuid}/roles`,
                  isLoading: group && group.loaded,
                },
              ]
            : []),
          { title: isRecordLoading ? undefined : role && (role.display_name || role.name), isActive: true },
        ]}
      >
        <Level>
          <LevelItem>
            <PageHeaderTitle title={title || <ToolbarTitlePlaceholder />} className="ins-rbac-page-header__title" />
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
          <TextContent className="ins-rbac-page-header__description">
            <Text component="p">{description}</Text>
          </TextContent>
        )}
      </TopToolbar>
      {isRecordLoading || !role ? <ListLoader /> : <Permissions />}
      <Route path={routes['role-detail-remove']}>
        {!isRecordLoading && (
          <RemoveRoleModal
            afterSubmit={() => dispatch(fetchRolesWithPolicies())}
            cancelRoute={routes['role-detail'].replace(':uuid', uuid)}
            routeMatch={routes['role-detail-remove']}
          />
        )}
      </Route>
      <Route path={routes['role-detail-edit']}>
        {!isRecordLoading && (
          <EditRoleModal afterSubmit={fetchData} cancelRoute={routes['role-detail'].replace(':uuid', uuid)} routeMatch={routes['role-detail-edit']} />
        )}
      </Route>
    </Fragment>
  );
};

Role.propTypes = {
  onDelete: PropTypes.string,
};

export default Role;
