import { useMemo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { useFlag } from '@unleash/proxy-client-react';
import { BAD_UUID } from '../../../helpers/dataUtilities';
import { DEFAULT_ACCESS_GROUP_ID } from '../../../utilities/constants';
import pathnames from '../../../utilities/pathnames';
import type { GroupState, RBACStore, TabItem } from '../types';

/**
 * Custom hook for managing Group component data and configuration
 * Handles Redux selectors, URL parameters, feature flags, and tab configuration
 */
export const useGroupData = () => {
  const chrome = useChrome();
  const { groupId } = useParams<{ groupId: string }>();
  const isPlatformDefault = groupId === DEFAULT_ACCESS_GROUP_ID;

  // Feature flag for service accounts
  const enableServiceAccounts =
    (chrome.isBeta() && useFlag('platform.rbac.group-service-accounts')) ||
    (!chrome.isBeta() && useFlag('platform.rbac.group-service-accounts.stable'));

  // Group existence and system group data
  const { groupExists, systemGroupUuid } = useSelector(
    ({ groupReducer }: RBACStore) => ({
      groupExists: groupReducer?.error !== BAD_UUID,
      systemGroupUuid: groupReducer?.systemGroup?.uuid,
    }),
    shallowEqual,
  );

  // Group details and loading state
  const { group, isGroupLoading } = useSelector(
    ({ groupReducer }: RBACStore) => ({
      group: groupReducer?.selectedGroup as GroupState | undefined,
      isGroupLoading: groupReducer?.isRecordLoading || false,
    }),
    shallowEqual,
  );

  // Tab configuration with conditional service accounts tab
  const tabItems: TabItem[] = useMemo(
    () => [
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
    ],
    [groupId, enableServiceAccounts],
  );

  return {
    // Parameters
    groupId,
    isPlatformDefault,

    // Feature flags
    enableServiceAccounts,

    // Group data
    group,
    isGroupLoading,
    groupExists,
    systemGroupUuid,

    // Configuration
    tabItems,

    // Chrome
    chrome,
  };
};
