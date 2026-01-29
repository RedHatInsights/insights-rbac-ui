import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { useFlag } from '@unleash/proxy-client-react';
import { DEFAULT_ACCESS_GROUP_ID } from '../../../utilities/constants';
import pathnames from '../../../utilities/pathnames';
import { type Group, useGroupQuery, useGroupsQuery } from '../../../data/queries/groups';

// Tab item interface for navigation tabs
interface TabItem {
  eventKey: number;
  title: string;
  name: string;
  to: string;
}

/**
 * Custom hook for managing Group component data and configuration
 * Handles data fetching via React Query, URL parameters, feature flags, and tab configuration
 *
 * Uses React Query for data fetching.
 */
export const useGroupData = () => {
  const chrome = useChrome();
  const { groupId } = useParams<{ groupId: string }>();
  const isPlatformDefault = groupId === DEFAULT_ACCESS_GROUP_ID;

  // Feature flag for service accounts
  const enableServiceAccounts =
    (chrome.isBeta() && useFlag('platform.rbac.group-service-accounts')) ||
    (!chrome.isBeta() && useFlag('platform.rbac.group-service-accounts.stable'));

  // Fetch system group (platform default) to get its UUID
  const { data: systemGroupData } = useGroupsQuery({ platformDefault: true, limit: 1 }, { enabled: true });
  const systemGroupUuid = systemGroupData?.data?.[0]?.uuid;

  // Determine which group ID to fetch
  const effectiveGroupId = isPlatformDefault ? systemGroupUuid : groupId;

  // Fetch the group data
  const { data: groupData, isLoading: isGroupLoading, isError } = useGroupQuery(effectiveGroupId ?? '', { enabled: !!effectiveGroupId });

  // Transform to expected shape with required defaults
  // The API returns optional booleans, but components expect required booleans
  const group = groupData
    ? {
        uuid: groupData.uuid,
        name: groupData.name,
        description: groupData.description,
        platform_default: groupData.platform_default ?? false,
        admin_default: groupData.admin_default ?? false,
        system: groupData.system ?? false,
        principalCount: (groupData as Group).principalCount,
        roleCount: (groupData as Group).roleCount,
        created: groupData.created,
        modified: groupData.modified,
      }
    : undefined;

  // Group exists if we have data and no error (404 = doesn't exist)
  const groupExists = !isError;

  // Tab configuration with conditional service accounts tab
  const tabItems: TabItem[] = useMemo(
    () => [
      { eventKey: 0, title: 'Roles', name: pathnames['group-detail-roles'].link(groupId || ''), to: 'roles' },
      { eventKey: 1, title: 'Members', name: pathnames['group-detail-members'].link(groupId || ''), to: 'members' },
      ...(enableServiceAccounts
        ? [
            {
              eventKey: 2,
              title: 'Service accounts',
              name: pathnames['group-detail-service-accounts'].link(groupId || ''),
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
