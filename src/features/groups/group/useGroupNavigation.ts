import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { useLocation, useNavigationType } from 'react-router-dom';
import useAppNavigate from '../../../hooks/useAppNavigate';
import messages from '../../../Messages';
import pathnames from '../../../utilities/pathnames';
import type { GroupState, OutletContext } from '../types';

interface UseGroupNavigationProps {
  groupId?: string;
  systemGroupUuid?: string;
  group?: GroupState;
  isGroupLoading: boolean;
  groupExists: boolean;
  onDefaultGroupChanged: (show: boolean) => void;
}

/**
 * Custom hook for managing Group component navigation logic
 * Handles breadcrumbs, navigation, and outlet context
 */
export const useGroupNavigation = ({
  groupId,
  systemGroupUuid,
  group,
  isGroupLoading,
  groupExists,
  onDefaultGroupChanged,
}: UseGroupNavigationProps) => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();

  // Generate breadcrumbs list
  const breadcrumbsList = useMemo(
    () => [
      {
        title: intl.formatMessage(messages.groups),
        to: pathnames.groups.link,
      },
      groupExists
        ? { title: isGroupLoading ? undefined : group?.name, isActive: true }
        : { title: intl.formatMessage(messages.invalidGroup), isActive: true },
    ],
    [intl, groupExists, isGroupLoading, group?.name],
  );

  // Create outlet context for child routes
  const outletContext: OutletContext = useMemo(
    () => ({
      [pathnames['group-detail-roles'].path]: {
        onDefaultGroupChanged,
      },
      groupId: groupId || '',
      systemGroupUuid,
    }),
    [groupId, systemGroupUuid, onDefaultGroupChanged],
  );

  // Navigation helpers
  const navigateBack = () => {
    navigate(navigationType !== 'POP' ? '../' : pathnames.groups.link);
  };

  return {
    // Navigation
    navigate,
    location,
    navigationType,

    // Data
    breadcrumbsList,
    outletContext,

    // Actions
    navigateBack,
  };
};
