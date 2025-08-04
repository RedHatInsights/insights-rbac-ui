import React, { Fragment } from 'react';
import { Split, SplitItem } from '@patternfly/react-core';
import { Dropdown, DropdownItem, KebabToggle } from '@patternfly/react-core/deprecated';
import { PageTitle } from '../../../../components/layout/PageLayout';
import { AppLink } from '../../../../components/navigation/AppLink';
import { DefaultGroupChangedIcon } from './DefaultGroupChangedIcon';
import { DefaultGroupRestore } from './DefaultGroupRestore';
import type { GroupState } from '../../types';

interface GroupHeaderProps {
  /**
   * Group data object
   */
  group?: GroupState;

  /**
   * Whether group data is currently loading
   */
  isGroupLoading: boolean;

  /**
   * Whether the actions dropdown is open
   */
  isDropdownOpen: boolean;

  /**
   * Handler for toggling the actions dropdown
   */
  onDropdownToggle: (isOpen: boolean) => void;

  /**
   * Handler for triggering reset warning modal
   */
  onResetWarning: () => void;

  /**
   * URL for edit action
   */
  editUrl: string;

  /**
   * URL for delete action
   */
  deleteUrl: string;

  /**
   * Label for edit action
   */
  editLabel: string;

  /**
   * Label for delete action
   */
  deleteLabel: string;
}

/**
 * Group header component with title, actions, and restore functionality
 * Handles display of group name, default group indicators, and action dropdown
 */
export const GroupHeader: React.FC<GroupHeaderProps> = ({
  group,
  isGroupLoading,
  isDropdownOpen,
  onDropdownToggle,
  onResetWarning,
  editUrl,
  deleteUrl,
  editLabel,
  deleteLabel,
}) => {
  // Create dropdown items
  const dropdownItems = [
    <DropdownItem
      component={
        <AppLink onClick={() => onDropdownToggle(false)} to={editUrl}>
          {editLabel}
        </AppLink>
      }
      key="edit-group"
    />,
    <DropdownItem component={<AppLink to={deleteUrl}>{deleteLabel}</AppLink>} className="rbac-c-group__action" key="delete-group" />,
  ];

  return (
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

      {/* Default Group Restore Button */}
      {group?.platform_default && !group?.system ? (
        <SplitItem>
          <DefaultGroupRestore onRestore={onResetWarning} />
        </SplitItem>
      ) : null}

      {/* Actions Dropdown */}
      <SplitItem>
        {group?.platform_default || group?.admin_default ? null : (
          <Dropdown
            ouiaId="group-title-actions-dropdown"
            toggle={<KebabToggle onToggle={(_event, isOpen) => onDropdownToggle(isOpen)} id="group-actions-dropdown" />}
            isOpen={isDropdownOpen}
            isPlain
            position="right"
            dropdownItems={dropdownItems}
          />
        )}
      </SplitItem>
    </Split>
  );
};
