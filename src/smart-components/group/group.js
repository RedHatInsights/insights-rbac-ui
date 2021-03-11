import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Route, Redirect, Link, useLocation, useHistory } from 'react-router-dom';
import { connect, useDispatch } from 'react-redux';
import { bindActionCreators } from 'redux';
import AppTabs from '../app-tabs/app-tabs';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import GroupPrincipals from './principal/principals';
import GroupRoles from './role/group-roles';
import { fetchGroup, fetchGroups } from '../../redux/actions/group-actions';
import { ListLoader } from '../../presentational-components/shared/loader-placeholders';
import { Alert, AlertActionCloseButton, Popover, Split, SplitItem, DropdownItem, Dropdown, KebabToggle, Button } from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';
import { routes } from '../../../package.json';
import EditGroup from './edit-group-modal';
import RemoveGroup from './remove-group-modal';
import EmptyWithAction from '../../presentational-components/shared/empty-state';
import RbacBreadcrumbs from '../../presentational-components/shared/breadcrubms';
import './group.scss';

const Group = ({
  match: {
    params: { uuid },
  },
  group,
  fetchGroup,
  isFetching,
  onDelete,
}) => {
  const tabItems = [
    { eventKey: 0, title: 'Roles', name: `/groups/detail/${uuid}/roles` },
    { eventKey: 1, title: 'Members', name: `/groups/detail/${uuid}/members` },
  ];

  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [showDefaultGroupChangedInfo, setShowDefaultGroupChangedInfo] = useState(false);
  const [groupExists, setGroupExists] = useState(true);

  const history = useHistory();

  const breadcrumbsList = () => [
    { title: 'Groups', to: '/groups' },
    groupExists ? { title: isFetching ? undefined : group.name, isActive: true } : { title: 'Invalid group', isActive: true },
  ];

  const fetchData = (apiProps) => {
    fetchGroup(apiProps).then(({ value }) => {
      value?.error && setGroupExists(false);
    });
  };

  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    fetchData(uuid);
    insights.chrome.appObjectId(uuid);
    return () => insights.chrome.appObjectId(undefined);
  }, []);

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
          <InfoCircleIcon className="ins-c-rbac__default-group-info-icon" />
        </Popover>
      </div>
    </div>
  );

  const dropdownItems = [
    <DropdownItem
      component={
        <Link
          to={(location.pathname.includes('members') ? routes['group-detail-members-edit'] : routes['group-detail-roles-edit']).replace(
            ':uuid',
            uuid
          )}
        >
          Edit
        </Link>
      }
      key="edit-group"
    />,
    <DropdownItem
      component={
        <Link
          onClick={onDelete}
          to={() =>
            (location.pathname.includes('members') ? routes['group-detail-members-remove'] : routes['group-detail-roles-remove']).replace(
              ':uuid',
              uuid
            )
          }
        >
          Delete
        </Link>
      }
      className="ins-c-group__action"
      key="delete-group"
    />,
  ];

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
                {group.platform_default ? null : (
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
          <Route
            path={[routes['group-detail-roles-remove'], routes['group-detail-members-remove']]}
            render={(props) => (
              <RemoveGroup
                {...props}
                postMethod={() => {
                  dispatch(fetchGroups());
                }}
                isModalOpen
                groupsUuid={[group]}
              />
            )}
          />
          <Route
            path={[routes['group-detail-roles-edit'], routes['group-detail-members-edit']]}
            render={(props) => (
              <EditGroup
                {...props}
                group={group}
                closeUrl={`group/detail/${uuid}`}
                postMethod={() => {
                  fetchData(uuid);
                }}
              />
            )}
          />
          <Route
            path={routes['group-detail-roles']}
            render={(props) => <GroupRoles {...props} onDefaultGroupChanged={setShowDefaultGroupChangedInfo} />}
          />
          <Route path={routes['group-detail-members']} component={GroupPrincipals} />
          <Route render={() => <Redirect to={`/groups/detail/${uuid}/roles`} />} />
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
                onClick={() => history.goBack()}
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
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }),
  match: PropTypes.object,
  group: PropTypes.shape({
    uuid: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    platform_default: PropTypes.bool,
    system: PropTypes.bool,
  }),
  isFetching: PropTypes.bool,
  fetchGroup: PropTypes.func,
  onDelete: PropTypes.func,
};

Group.defaultProps = {
  isFetching: false,
};

export default connect(mapStateToProps, mapDispatchToProps)(Group);
