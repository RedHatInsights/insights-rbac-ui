import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Route, Link, useLocation, useNavigate, useParams, Routes, Navigate } from 'react-router-dom';
import { connect, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { bindActionCreators } from 'redux';
import AppTabs from '../app-tabs/app-tabs';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import GroupPrincipals from './principal/principals';
import GroupRoles from './role/group-roles';
import { fetchGroup, fetchGroups, fetchSystemGroup } from '../../redux/actions/group-actions';
import { ListLoader } from '../../presentational-components/shared/loader-placeholders';
import { Alert, AlertActionCloseButton, Popover, Split, SplitItem, DropdownItem, Dropdown, KebabToggle, Button } from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';
import pathnames from '../../utilities/pathnames';
import EditGroup from './edit-group-modal';
import RemoveGroup from './remove-group-modal';
import EmptyWithAction from '../../presentational-components/shared/empty-state';
import RbacBreadcrumbs from '../../presentational-components/shared/breadcrubms';
import { BAD_UUID, getBackRoute } from '../../helpers/shared/helpers';
import './group.scss';

const Group = ({ group, fetchGroup, isFetching, onDelete }) => {
  const { uuid } = useParams();
  const isPlatformDefault = uuid === 'default-access';
  const tabItems = [
    { eventKey: 0, title: 'Roles', name: `/groups/detail/${uuid}/roles`, to: 'roles' },
    { eventKey: 1, title: 'Members', name: `/groups/detail/${uuid}/members`, to: 'members' },
  ];

  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [showDefaultGroupChangedInfo, setShowDefaultGroupChangedInfo] = useState(false);

  const navigate = useNavigate();

  const { pagination, filters, groupExists, systemGroupUuid } = useSelector(
    ({ groupReducer: { groups, error, systemGroup } }) => ({
      pagination: groups.pagination || groups.meta,
      filters: groups.filters,
      groupExists: error !== BAD_UUID,
      systemGroupUuid: systemGroup?.uuid,
    }),
    shallowEqual
  );

  const breadcrumbsList = () => [
    {
      title: 'Groups',
      to: getBackRoute(pathnames.groups.path, pagination, filters),
    },
    groupExists ? { title: isFetching ? undefined : group.name, isActive: true } : { title: 'Invalid group', isActive: true },
  ];

  const fetchData = (apiProps) => {
    fetchGroup(apiProps);
  };

  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    fetchSystemGroup();
    const currUuid = uuid !== 'default-access' ? uuid : systemGroupUuid;
    fetchData(currUuid);
    if (currUuid) {
      insights.chrome.appObjectId(currUuid);
      return () => insights.chrome.appObjectId(undefined);
    }
  }, [systemGroupUuid]);

  const defaultGroupChangedIcon = (name) => (
    <div style={{ display: 'inline-flex' }}>
      {name}
      <div className="pf-u-ml-sm">
        <Popover
          aria-label="default-group-icon"
          bodyContent={
            <div>
              Now that you have edited the <b>Default access</b> group, the system will no longer update it with new default access roles. The group
              name has changed to <b>Custom default access</b>.
            </div>
          }
        >
          <InfoCircleIcon className="rbac-default-group-info-icon" />
        </Popover>
      </div>
    </div>
  );

  const dropdownItems = [
    <DropdownItem
      component={
        <Link onClick={() => setDropdownOpen(false)} to={location.pathname.includes('members') ? 'members/edit' : 'roles/edit'}>
          Edit
        </Link>
      }
      key="edit-group"
    />,
    <DropdownItem
      component={
        <Link onClick={() => onDelete(uuid)} to={location.pathname.includes('members') ? 'members/remove' : 'roles/remove'}>
          Delete
        </Link>
      }
      className="rbac-c-group__action"
      key="delete-group"
    />,
  ];

  const fetchUuid = isPlatformDefault ? systemGroupUuid : uuid;

  const getCancelRoute = () => (location.pathname.includes('members') ? '../members' : '../roles');

  return (
    <Fragment>
      {groupExists ? (
        <Fragment>
          <TopToolbar breadcrumbs={breadcrumbsList()}>
            <Split hasGutter>
              <SplitItem isFilled>
                <TopToolbarTitle
                  title={
                    !isFetching && group ? (
                      <Fragment>{group.platform_default && !group.system ? defaultGroupChangedIcon(group.name) : group.name}</Fragment>
                    ) : undefined
                  }
                  description={!isFetching && group ? group.description : undefined}
                />
              </SplitItem>
              <SplitItem>
                {group.platform_default || group.admin_default ? null : (
                  <Dropdown
                    ouiaId="group-title-actions-dropdown"
                    toggle={<KebabToggle onToggle={(isOpen) => setDropdownOpen(isOpen)} id="group-actions-dropdown" />}
                    isOpen={isDropdownOpen}
                    isPlain
                    position="right"
                    dropdownItems={dropdownItems}
                  />
                )}
              </SplitItem>
            </Split>
            {showDefaultGroupChangedInfo ? (
              <Alert
                variant="info"
                isInline
                title="Default access group has changed"
                action={<AlertActionCloseButton onClose={() => setShowDefaultGroupChangedInfo(false)} />}
                className="pf-u-mb-lg pf-u-mt-sm"
              >
                Now that you have edited the <b>Default access</b> group, the system will no longer update it with new default access roles. The group
                name has changed to <b>Custom default access</b>.
              </Alert>
            ) : null}
          </TopToolbar>
          <AppTabs isHeader tabItems={tabItems} />
          <Routes>
            <Route
              path="roles/remove"
              element={
                <RemoveGroup
                  postMethod={() => {
                    dispatch(fetchGroups({ ...pagination, offset: 0, filters, inModal: false }));
                  }}
                  cancelRoute={getCancelRoute()}
                  submitRoute={getBackRoute('/settings/rbac/groups', { ...pagination, offset: 0 }, filters)}
                  isModalOpen
                  groupsUuid={[group]}
                />
              }
            />
            <Route
              path="members/remove"
              element={
                <RemoveGroup
                  postMethod={() => {
                    dispatch(fetchGroups({ ...pagination, offset: 0, filters, inModal: false }));
                  }}
                  cancelRoute={getCancelRoute()}
                  submitRoute={getBackRoute('/settings/rbac/groups', { ...pagination, offset: 0 }, filters)}
                  isModalOpen
                  groupsUuid={[group]}
                />
              }
            />
            <Route
              path="roles/edit"
              element={
                <EditGroup
                  group={group}
                  cancelRoute={getCancelRoute()}
                  postMethod={() => {
                    fetchData(fetchUuid);
                  }}
                />
              }
            />
            <Route
              path="members/edit"
              element={
                <EditGroup
                  group={group}
                  cancelRoute={getCancelRoute()}
                  postMethod={() => {
                    fetchData(fetchUuid);
                  }}
                />
              }
            />
          </Routes>
          <Routes>
            <Route path="members/*" element={<GroupPrincipals />} />
            <Route path="roles/*" element={<GroupRoles onDefaultGroupChanged={setShowDefaultGroupChangedInfo} />} />
            <Route path="/*" element={<GroupRoles onDefaultGroupChanged={setShowDefaultGroupChangedInfo} />} />
          </Routes>
          {!group && <ListLoader />}
        </Fragment>
      ) : (
        <Fragment>
          <section className="pf-c-page__main-breadcrumb pf-u-pb-md">
            <RbacBreadcrumbs {...breadcrumbsList()} />
          </section>
          <EmptyWithAction
            title="Group not found"
            description={[`Group with ID ${uuid} does not exist.`]}
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

const mapStateToProps = ({ groupReducer: { selectedGroup, isRecordLoading, isRecordRolesLoading } }) => ({
  group: selectedGroup,
  isFetching: isRecordLoading || isRecordRolesLoading,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      fetchGroup,
    },
    dispatch
  );

Group.propTypes = {
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired,
  }),
  match: PropTypes.object,
  group: PropTypes.shape({
    uuid: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    admin_default: PropTypes.bool,
    platform_default: PropTypes.bool,
    system: PropTypes.bool,
  }),
  isFetching: PropTypes.bool,
  fetchGroup: PropTypes.func,
  onDelete: PropTypes.func,
  defaultUuid: PropTypes.string,
};

Group.defaultProps = {
  isFetching: false,
};

export default connect(mapStateToProps, mapDispatchToProps)(Group);
