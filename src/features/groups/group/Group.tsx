import React, { Fragment, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import SkeletonTable from '@patternfly/react-component-groups/dist/esm/SkeletonTable';
import { AppTabs } from '../../../components/navigation/AppTabs';
import { PageLayout } from '../../../components/layout/PageLayout';
import { GroupResetWarningModal } from './components/GroupResetWarningModal';
import { GroupHeader } from './components/GroupHeader';
import { GroupDefaultChangedAlert } from './components/GroupDefaultChangedAlert';
import { GroupNotFound } from './components/GroupNotFound';
import pathnames from '../../../utilities/pathnames';
// Custom hooks
import { useGroupData } from './useGroupData';
import { useGroupState } from './useGroupState';
import { useGroupDataLoad } from './useGroupDataLoad';
import { useGroupNavigation } from './useGroupNavigation';
import { useGroupActions } from './useGroupActions';
import './group.scss';

export const Group: React.FC = () => {
  // Data and configuration
  const { groupId, isPlatformDefault, group, isGroupLoading, groupExists, systemGroupUuid, tabItems, chrome } = useGroupData();

  // Local state management
  const {
    isResetWarningVisible,
    setResetWarningVisible,
    isDropdownOpen,
    setDropdownOpen,
    showDefaultGroupChangedInfo,
    setShowDefaultGroupChangedInfo,
  } = useGroupState();

  // Memoize callback to prevent infinite re-renders in useGroupNavigation
  const onDefaultGroupChanged = useCallback((show: boolean) => setShowDefaultGroupChangedInfo(show), []);

  // Navigation and context
  const { location, breadcrumbsList, outletContext, navigateBack } = useGroupNavigation({
    groupId,
    systemGroupUuid,
    group,
    isGroupLoading,
    groupExists,
    onDefaultGroupChanged,
  });

  // Memoized handlers to prevent infinite re-renders
  const handleResetWarningHide = useCallback(() => setResetWarningVisible(false), []);
  const handleDefaultGroupChangedHide = useCallback(() => setShowDefaultGroupChangedInfo(false), []);
  const handleResetWarningShow = useCallback(() => setResetWarningVisible(true), []);

  const navigateToGroup = useCallback((id: string) => {
    window.location.href = pathnames['group-detail-roles'].link.replace(':groupId', id);
  }, []);

  // Actions and handlers
  const { editUrl, deleteUrl, editLabel, deleteLabel, handleResetConfirm } = useGroupActions({
    groupId,
    isPlatformDefault,
    location,
    systemGroupUuid,
    chrome,
    onResetWarningHide: handleResetWarningHide,
    onDefaultGroupChangedHide: handleDefaultGroupChangedHide,
    navigateToGroup,
  });

  // Data loading for group and Chrome integration
  useGroupDataLoad({
    groupId,
    systemGroupUuid,
    isPlatformDefault,
    chrome,
  });

  return (
    <Fragment>
      {/* Reset Warning Modal */}
      <GroupResetWarningModal isOpen={isResetWarningVisible} onClose={handleResetWarningHide} onConfirm={handleResetConfirm} />

      {/* Main Content */}
      {groupExists ? (
        <Fragment>
          <PageLayout breadcrumbs={breadcrumbsList}>
            <GroupHeader
              group={group}
              isGroupLoading={isGroupLoading}
              isDropdownOpen={isDropdownOpen}
              onDropdownToggle={setDropdownOpen}
              onResetWarning={handleResetWarningShow}
              editUrl={editUrl}
              deleteUrl={deleteUrl}
              editLabel={editLabel}
              deleteLabel={deleteLabel}
            />

            <GroupDefaultChangedAlert isVisible={showDefaultGroupChangedInfo} onClose={handleDefaultGroupChangedHide} />
          </PageLayout>

          {/* Tabs and Content */}
          <AppTabs isHeader tabItems={tabItems} />
          <Outlet context={outletContext} />
          {!group && <SkeletonTable rows={5} />}
        </Fragment>
      ) : (
        <GroupNotFound groupId={groupId} breadcrumbsList={breadcrumbsList} onNavigateBack={navigateBack} />
      )}
    </Fragment>
  );
};

// Default export for routing
export default Group;
