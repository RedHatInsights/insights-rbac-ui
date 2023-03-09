import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { Route, Redirect, Link, useLocation, useHistory } from 'react-router-dom';
import { connect, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { bindActionCreators } from 'redux';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import AppTabs from '../app-tabs/app-tabs';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import GroupPrincipals from './principal/principals';
import GroupRoles from './role/group-roles';
import { WarningModal } from '../common/warningModal';
import { fetchGroup, fetchGroups, fetchSystemGroup, removeGroups } from '../../redux/actions/group-actions';
import { ListLoader } from '../../presentational-components/shared/loader-placeholders';
import {
  Alert,
  AlertActionCloseButton,
  Popover,
  PopoverPosition,
  Split,
  SplitItem,
  DropdownItem,
  Dropdown,
  KebabToggle,
  Button,
} from '@patternfly/react-core';
import pathnames from '../../utilities/pathnames';
import EditGroup from './edit-group-modal';
import RemoveGroup from './remove-group-modal';
import EmptyWithAction from '../../presentational-components/shared/empty-state';
import RbacBreadcrumbs from '../../presentational-components/shared/breadcrumbs';
import { BAD_UUID, getBackRoute } from '../../helpers/shared/helpers';
import { FormattedMessage, useIntl } from 'react-intl';
import messages from '../../Messages';
import './group.scss';

const Group = ({
  match: {
    params: { uuid },
  },
  group,
  fetchGroup,
  fetchSystemGroup,
  removeGroups,
  isFetching,
  onDelete,
}) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();
  const chrome = useChrome();
  const isPlatformDefault = uuid === 'default-access';
  const tabItems = [
    { eventKey: 0, title: intl.formatMessage(messages.roles), name: `/groups/detail/${uuid}/roles` },
    { eventKey: 1, title: intl.formatMessage(messages.members), name: `/groups/detail/${uuid}/members` },
  ];

  const { pagination, filters, groupExists, systemGroupUuid } = useSelector(
    ({ groupReducer: { groups, error, systemGroup } }) => ({
      pagination: groups.pagination || groups.meta,
      filters: groups.filters,
      groupExists: error !== BAD_UUID,
      systemGroupUuid: systemGroup?.uuid,
    }),
    shallowEqual
  );

  const [isResetWarningVisible, setResetWarningVisible] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [showDefaultGroupChangedInfo, setShowDefaultGroupChangedInfo] = useState(false);

  useEffect(() => {
    fetchSystemGroup();
    const currUuid = !isPlatformDefault ? uuid : systemGroupUuid;
    if (currUuid) {
      fetchGroup(currUuid);
      chrome.appObjectId(currUuid);
    }
    return () => chrome.appObjectId(undefined);
  }, [uuid, systemGroupUuid]);

  const breadcrumbsList = () => [
    {
      title: intl.formatMessage(messages.groups),
      to: getBackRoute(pathnames.groups.path, pagination, filters),
    },
    groupExists
      ? { title: isFetching ? undefined : group.name, isActive: true }
      : { title: intl.formatMessage(messages.invalidGroup), isActive: true },
  ];

  const defaultGroupChangedIcon = (name) => (
    <div style={{ display: 'inline-flex' }}>
      {name}
      <div className="pf-u-ml-sm">
        <Popover
          aria-label="default-group-icon"
          bodyContent={
            <FormattedMessage
              {...messages.defaultAccessGroupNameChanged}
              values={{
                b: (text) => <b>{text}</b>,
              }}
            />
          }
        >
          <OutlinedQuestionCircleIcon className="rbac-default-group-info-icon" />
        </Popover>
      </div>
    </div>
  );

  const defaultGroupRestore = () => (
    <div className="rbac-default-group-reset-btn">
      <Button variant="link" onClick={() => setResetWarningVisible(true)}>
        {intl.formatMessage(messages.restoreToDefault)}
      </Button>
      <Popover
        aria-label="default-group-icon"
        position={PopoverPosition.bottomEnd}
        bodyContent={
          <FormattedMessage
            {...messages.restoreDefaultAccessInfo}
            values={{
              b: (text) => <b>{text}</b>,
            }}
          />
        }
      >
        <OutlinedQuestionCircleIcon className="rbac-default-group-info-icon pf-u-mt-sm" />
      </Popover>
    </div>
  );

  const dropdownItems = [
    <DropdownItem
      component={
        <Link
          onClick={() => setDropdownOpen(false)}
          to={(location.pathname.includes('members') ? pathnames['group-detail-members-edit'] : pathnames['group-detail-roles-edit']).path.replace(
            ':uuid',
            isPlatformDefault ? 'default-access' : uuid
          )}
        >
          {intl.formatMessage(messages.edit)}
        </Link>
      }
      key="edit-group"
    />,
    <DropdownItem
      component={
        <Link
          onClick={() => onDelete(uuid)}
          to={() =>
            (location.pathname.includes('members') ? pathnames['group-detail-members-remove'] : pathnames['group-detail-roles-remove']).path.replace(
              ':uuid',
              uuid
            )
          }
        >
          {intl.formatMessage(messages.delete)}
        </Link>
      }
      className="rbac-c-group__action"
      key="delete-group"
    />,
  ];

  const fetchUuid = isPlatformDefault ? systemGroupUuid : uuid;

  return (
    <Fragment>
      {isResetWarningVisible && (
        <WarningModal
          type="group"
          isOpen={isResetWarningVisible}
          customTitle={<div>{intl.formatMessage(messages.restoreDefaultAccessQuestion)}</div>}
          customDescription={
            <FormattedMessage
              {...messages.restoreDefaultAccessDescription}
              values={{
                b: (text) => <b>{text}</b>,
              }}
            />
          }
          customPrimaryButtonTitle={intl.formatMessage(messages.continue)}
          customSecondaryButtonTitle={intl.formatMessage(messages.cancel)}
          onModalCancel={() => setResetWarningVisible(false)}
          onConfirmCancel={() => {
            removeGroups([systemGroupUuid]).then(() =>
              fetchSystemGroup().then(() => {
                setShowDefaultGroupChangedInfo(false);
              })
            );
            setResetWarningVisible(false);
            history.push('/groups/detail/default-access/roles');
          }}
        />
      )}
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
              {group.platform_default && !group.system ? <SplitItem>{defaultGroupRestore()}</SplitItem> : null}
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
                title={intl.formatMessage(messages.defaultAccessGroupChanged)}
                action={<AlertActionCloseButton onClose={() => setShowDefaultGroupChangedInfo(false)} />}
                className="pf-u-mb-lg pf-u-mt-sm"
              >
                <FormattedMessage
                  {...messages.defaultAccessGroupNameChanged}
                  values={{
                    b: (text) => <b>{text}</b>,
                  }}
                />
              </Alert>
            ) : null}
          </TopToolbar>
          <AppTabs isHeader tabItems={tabItems} />
          <Route
            path={[pathnames['group-detail-roles-remove'].path, pathnames['group-detail-members-remove'].path]}
            render={(props) => (
              <RemoveGroup
                {...props}
                postMethod={() => {
                  dispatch(fetchGroups({ ...pagination, offset: 0, filters, inModal: false }));
                }}
                cancelRoute={`group/detail/${uuid}`}
                submitRoute={getBackRoute(pathnames.groups.path, { ...pagination, offset: 0 }, filters)}
                isModalOpen
                groupsUuid={[group]}
              />
            )}
          />
          <Route
            path={[pathnames['group-detail-roles-edit'].path, pathnames['group-detail-members-edit'].path]}
            render={(props) => <EditGroup {...props} group={group} cancelRoute={`group/detail/${uuid}`} postMethod={() => fetchGroup(fetchUuid)} />}
          />
          <Route
            path={pathnames['group-detail-roles'].path}
            render={(props) => <GroupRoles {...props} onDefaultGroupChanged={setShowDefaultGroupChangedInfo} />}
          />
          <Route path={pathnames['group-detail-members'].path} component={GroupPrincipals} />
          <Route render={() => <Redirect to={`/groups/detail/${uuid}/roles`} />} />
          {!group && <ListLoader />}
        </Fragment>
      ) : (
        <Fragment>
          <section className="pf-c-page__main-breadcrumb pf-u-pb-md">
            <RbacBreadcrumbs {...breadcrumbsList()} />
          </section>
          <EmptyWithAction
            title={intl.formatMessage(messages.groupNotFound)}
            description={[intl.formatMessage(messages.groupDoesNotExist, { id: uuid })]}
            actions={[
              <Button
                key="back-button"
                className="pf-u-mt-xl"
                ouiaId="back-button"
                variant="primary"
                aria-label="Back to previous page"
                onClick={() => history.goBack()}
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

const mapStateToProps = ({ groupReducer: { selectedGroup, isRecordLoading, isRecordRolesLoading } }) => ({
  group: selectedGroup,
  isFetching: isRecordLoading || isRecordRolesLoading,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      fetchGroup,
      fetchSystemGroup,
      removeGroups,
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
    admin_default: PropTypes.bool,
    platform_default: PropTypes.bool,
    system: PropTypes.bool,
  }),
  isFetching: PropTypes.bool,
  fetchGroup: PropTypes.func,
  fetchSystemGroup: PropTypes.func,
  removeGroups: PropTypes.func,
  onDelete: PropTypes.func,
  defaultUuid: PropTypes.string,
};

Group.defaultProps = {
  isFetching: false,
};

export default connect(mapStateToProps, mapDispatchToProps)(Group);
