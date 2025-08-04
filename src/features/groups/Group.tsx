import React, { Fragment, useEffect, useState } from 'react';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { Outlet, useLocation, useNavigationType, useParams } from 'react-router-dom';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { FormattedMessage, useIntl } from 'react-intl';
import { Alert, AlertActionCloseButton, Button, Split, SplitItem } from '@patternfly/react-core';
import { Dropdown, DropdownItem, KebabToggle } from '@patternfly/react-core/deprecated';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import SkeletonTable from '@patternfly/react-component-groups/dist/esm/SkeletonTable';
import { AppTabs } from '../../components/navigation/AppTabs';
import useAppNavigate from '../../hooks/useAppNavigate';
import { PageLayout, PageTitle } from '../../components/layout/PageLayout';
import { fetchGroup, fetchSystemGroup, removeGroups } from '../../redux/groups/actions';
import { AppLink } from '../../components/navigation/AppLink';
import { EmptyWithAction } from '../../components/ui-states/EmptyState';
import { RbacBreadcrumbs } from '../../components/navigation/Breadcrumbs';
import { DefaultGroupChangedIcon } from './components/DefaultGroupChangedIcon';
import { DefaultGroupRestore } from './components/DefaultGroupRestore';
import { BAD_UUID } from '../../helpers/dataUtilities';
import { DEFAULT_ACCESS_GROUP_ID } from '../../utilities/constants';
import messages from '../../Messages';
import pathnames from '../../utilities/pathnames';
import { useFlag } from '@unleash/proxy-client-react';
import type { GroupState, OutletContext, RBACStore, TabItem } from './types';
import './group.scss';

export const Group: React.FC = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const chrome = useChrome();
  const { groupId } = useParams<{ groupId: string }>();
  const isPlatformDefault = groupId === DEFAULT_ACCESS_GROUP_ID;
  const enableServiceAccounts =
    (chrome.isBeta() && useFlag('platform.rbac.group-service-accounts')) ||
    (!chrome.isBeta() && useFlag('platform.rbac.group-service-accounts.stable'));

  const tabItems: TabItem[] = [
    { eventKey: 0, title: 'Roles', name: pathnames['group-detail-roles'].link.replace(':groupId', groupId || ''), to: 'roles' },
    { eventKey: 1, title: 'Members', name: pathnames['group-detail-members'].link.replace(':groupId', groupId || ''), to: 'members' },
    ...(enableServiceAccounts
      ? [
          {
            eventKey: 2,
            title: 'Service accounts',
            name: pathnames['group-detail-service-accounts'].link.replace(':groupId', groupId || ''),
            to: 'service-accounts',
          },
        ]
      : []),
  ];

  const { groupExists, systemGroupUuid } = useSelector(
    ({ groupReducer }: RBACStore) => ({
      groupExists: groupReducer?.error !== BAD_UUID,
      systemGroupUuid: groupReducer?.systemGroup?.uuid,
    }),
    shallowEqual,
  );

  const { group, isGroupLoading } = useSelector(
    ({ groupReducer }: RBACStore) => ({
      group: groupReducer?.selectedGroup as GroupState | undefined,
      isGroupLoading: groupReducer?.isRecordLoading || false,
    }),
    shallowEqual,
  );

  const [isResetWarningVisible, setResetWarningVisible] = useState<boolean>(false);
  const [isDropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [showDefaultGroupChangedInfo, setShowDefaultGroupChangedInfo] = useState<boolean>(false);

  useEffect(() => {
    dispatch(fetchSystemGroup({ chrome }));
    const currId = !isPlatformDefault ? groupId : systemGroupUuid;
    if (currId) {
      dispatch(fetchGroup(currId));
      chrome.appObjectId(currId);
    }
    return () => chrome.appObjectId('');
  }, [groupId, systemGroupUuid, dispatch, chrome, isPlatformDefault]);

  const breadcrumbsList = () => [
    {
      title: intl.formatMessage(messages.groups),
      to: pathnames.groups.link,
    },
    groupExists
      ? { title: isGroupLoading ? undefined : group?.name, isActive: true }
      : { title: intl.formatMessage(messages.invalidGroup), isActive: true },
  ];

  const dropdownItems = [
    <DropdownItem
      component={
        <AppLink
          onClick={() => setDropdownOpen(false)}
          to={(location.pathname.includes('members') ? pathnames['group-members-edit-group'] : pathnames['group-roles-edit-group']).link.replace(
            ':groupId',
            isPlatformDefault ? DEFAULT_ACCESS_GROUP_ID : groupId || '',
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
            groupId || '',
          )}
        >
          {intl.formatMessage(messages.delete)}
        </AppLink>
      }
      className="rbac-c-group__action"
      key="delete-group"
    />,
  ];

  const outletContext: OutletContext = {
    [pathnames['group-detail-roles'].path]: {
      onDefaultGroupChanged: setShowDefaultGroupChangedInfo,
    },
    groupId: groupId || '',
    systemGroupUuid,
  };

  return (
    <Fragment>
      {isResetWarningVisible && (
        <WarningModal
          isOpen={isResetWarningVisible}
          title={intl.formatMessage(messages.restoreDefaultAccessQuestion)}
          confirmButtonLabel={intl.formatMessage(messages.continue)}
          onClose={() => setResetWarningVisible(false)}
          onConfirm={async () => {
            if (systemGroupUuid) {
              await dispatch(removeGroups([systemGroupUuid]));
              await dispatch(fetchSystemGroup({ chrome }));
              setShowDefaultGroupChangedInfo(false);
            }
            setResetWarningVisible(false);
            navigate(pathnames['group-detail-roles'].link.replace(':groupId', DEFAULT_ACCESS_GROUP_ID));
          }}
        >
          <FormattedMessage
            {...messages.restoreDefaultAccessDescription}
            values={{
              b: (text: React.ReactNode) => <b>{text}</b>,
            }}
          />
        </WarningModal>
      )}
      {groupExists ? (
        <Fragment>
          <PageLayout breadcrumbs={breadcrumbsList()}>
            <Split hasGutter>
              <SplitItem isFilled>
                <PageTitle
                  title={
                    !isGroupLoading && group ? (
                      <Fragment>{group.platform_default && !group.system ? <DefaultGroupChangedIcon name={group.name} /> : group.name}</Fragment>
                    ) : undefined
                  }
                  description={(!isGroupLoading && group?.description) || undefined}
                />
              </SplitItem>
              {group?.platform_default && !group?.system ? (
                <SplitItem>
                  <DefaultGroupRestore onRestore={() => setResetWarningVisible(true)} />
                </SplitItem>
              ) : null}
              <SplitItem>
                {group?.platform_default || group?.admin_default ? null : (
                  <Dropdown
                    ouiaId="group-title-actions-dropdown"
                    toggle={<KebabToggle onToggle={(_event, isOpen) => setDropdownOpen(isOpen)} id="group-actions-dropdown" />}
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
                actionClose={<AlertActionCloseButton onClose={() => setShowDefaultGroupChangedInfo(false)} />}
                className="pf-v5-u-mb-lg pf-v5-u-mt-sm"
              >
                <FormattedMessage
                  {...messages.defaultAccessGroupNameChanged}
                  values={{
                    b: (text: React.ReactNode) => <b>{text}</b>,
                  }}
                />
              </Alert>
            ) : null}
          </PageLayout>
          <AppTabs isHeader tabItems={tabItems} />
          <Outlet context={outletContext} />
          {!group && <SkeletonTable rows={5} />}
        </Fragment>
      ) : (
        <Fragment>
          <section className="pf-v5-c-page__main-breadcrumb pf-v5-u-pb-md">
            <RbacBreadcrumbs breadcrumbs={breadcrumbsList()} />
          </section>
          <EmptyWithAction
            title={intl.formatMessage(messages.groupNotFound)}
            description={[intl.formatMessage(messages.groupDoesNotExist, { id: groupId })]}
            actions={[
              <Button
                key="back-button"
                className="pf-v5-u-mt-xl"
                ouiaId="back-button"
                variant="primary"
                aria-label="Back to previous page"
                onClick={() => navigate(navigationType !== 'POP' ? '../' : pathnames.groups.link)}
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
