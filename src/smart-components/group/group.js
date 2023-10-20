import React, { Fragment, useEffect, useState } from 'react';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { useLocation, useParams, Outlet } from 'react-router-dom';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { FormattedMessage, useIntl } from 'react-intl';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
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
import { useFlag } from '@unleash/proxy-client-react';
import AppTabs from '../app-tabs/app-tabs';
import useAppNavigate from '../../hooks/useAppNavigate';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import { WarningModal } from '../common/warningModal';
import { fetchGroup, fetchSystemGroup, removeGroups } from '../../redux/actions/group-actions';
import { ListLoader } from '../../presentational-components/shared/loader-placeholders';
import AppLink, { mergeToBasename } from '../../presentational-components/shared/AppLink';
import EmptyWithAction from '../../presentational-components/shared/empty-state';
import RbacBreadcrumbs from '../../presentational-components/shared/breadcrumbs';
import { BAD_UUID, getBackRoute } from '../../helpers/shared/helpers';
import messages from '../../Messages';
import pathnames from '../../utilities/pathnames';
import './group.scss';

const Group = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const location = useLocation();
  const chrome = useChrome();
  const { groupId } = useParams();
  const isPlatformDefault = groupId === 'default-access';
  const enableServiceAccounts = useFlag('platform.rbac.group-service-accounts');

  const tabItems = [
    { eventKey: 0, title: 'Roles', name: pathnames['group-detail-roles'].link.replace(':groupId', groupId), to: 'roles' },
    { eventKey: 1, title: 'Members', name: pathnames['group-detail-members'].link.replace(':groupId', groupId), to: 'members' },
    ...(enableServiceAccounts
      ? [
          {
            eventKey: 2,
            title: 'Service accounts',
            name: pathnames['group-detail-service-accounts'].link.replace(':groupId', groupId),
            to: 'service-accounts',
          },
        ]
      : []),
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

  const { group, isFetching } = useSelector(
    ({ groupReducer: { selectedGroup, isRecordLoading, isRecordRolesLoading } }) => ({
      group: selectedGroup,
      isFetching: isRecordLoading || isRecordRolesLoading,
    }),
    shallowEqual
  );

  const [isResetWarningVisible, setResetWarningVisible] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [showDefaultGroupChangedInfo, setShowDefaultGroupChangedInfo] = useState(false);

  useEffect(() => {
    dispatch(fetchSystemGroup({ chrome }));
    const currId = !isPlatformDefault ? groupId : systemGroupUuid;
    if (currId) {
      dispatch(fetchGroup(currId));
      chrome.appObjectId(currId);
    }
    return () => chrome.appObjectId(undefined);
  }, [groupId, systemGroupUuid]);

  const breadcrumbsList = () => [
    {
      title: intl.formatMessage(messages.groups),
      to: getBackRoute(mergeToBasename(pathnames.groups.link), pagination, filters),
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
        <AppLink
          onClick={() => setDropdownOpen(false)}
          to={(location.pathname.includes('members') ? pathnames['group-members-edit-group'] : pathnames['group-roles-edit-group']).link.replace(
            ':groupId',
            isPlatformDefault ? 'default-access' : groupId
          )}
        >
          {intl.formatMessage(messages.edit)}
        </AppLink>
      }
      key="edit-group"
    />,
    <DropdownItem
      component={
        <AppLink
          to={(location.pathname.includes('members') ? pathnames['group-members-remove-group'] : pathnames['group-roles-remove-group']).link.replace(
            ':groupId',
            groupId
          )}
        >
          {intl.formatMessage(messages.delete)}
        </AppLink>
      }
      className="rbac-c-group__action"
      key="delete-group"
    />,
  ];

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
            dispatch(removeGroups([systemGroupUuid])).then(() =>
              dispatch(fetchSystemGroup({ chrome })).then(() => {
                setShowDefaultGroupChangedInfo(false);
              })
            );
            setResetWarningVisible(false);
            navigate(pathnames['group-detail-roles'].link.replace(':groupId', 'default-access'));
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
          <Outlet
            context={{
              [pathnames['group-detail-roles'].path]: {
                onDefaultGroupChanged: setShowDefaultGroupChangedInfo,
              },
              groupId, // used for redirect from /:groupId to /:groupId/roles
            }}
          />
          {!group && <ListLoader />}
        </Fragment>
      ) : (
        <Fragment>
          <section className="pf-c-page__main-breadcrumb pf-u-pb-md">
            <RbacBreadcrumbs {...breadcrumbsList()} />
          </section>
          <EmptyWithAction
            title={intl.formatMessage(messages.groupNotFound)}
            description={[intl.formatMessage(messages.groupDoesNotExist, { id: groupId })]}
            actions={[
              <Button
                key="back-button"
                className="pf-u-mt-xl"
                ouiaId="back-button"
                variant="primary"
                aria-label="Back to previous page"
                onClick={() => navigate(-1)}
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

export default Group;
