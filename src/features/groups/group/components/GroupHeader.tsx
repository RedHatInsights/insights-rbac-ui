import React, { Fragment } from 'react';
import { Dropdown, DropdownItem, DropdownList, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons';
import PageHeader from '@patternfly/react-component-groups/dist/dynamic/PageHeader';
import { AppLink } from '../../../../components/navigation/AppLink';
import { DefaultGroupChangedIcon } from './DefaultGroupChangedIcon';
import { DefaultGroupRestore } from './DefaultGroupRestore';
import type { GroupState } from '../../types';
import { ToolbarTitlePlaceholder } from '../../../../components/ui-states/LoaderPlaceholders';

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
  const title =
    !isGroupLoading && group ? (
      <Fragment>{group.platform_default && !group.system ? <DefaultGroupChangedIcon name={group.name} /> : group.name}</Fragment>
    ) : (
      <ToolbarTitlePlaceholder />
    );

  const actionsDropdown =
    group?.platform_default || group?.admin_default ? null : (
      <Dropdown
        popperProps={{ position: 'right' }}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            variant="plain"
            onClick={() => onDropdownToggle(!isDropdownOpen)}
            isExpanded={isDropdownOpen}
            id="group-actions-dropdown"
            data-ouia-component-id="group-title-actions-dropdown"
            aria-label="Actions"
          >
            <EllipsisVIcon />
          </MenuToggle>
        )}
        isOpen={isDropdownOpen}
        onOpenChange={onDropdownToggle}
      >
        <DropdownList>
          <DropdownItem key="edit-group" onClick={() => onDropdownToggle(false)}>
            <AppLink to={editUrl}>{editLabel}</AppLink>
          </DropdownItem>
          <DropdownItem key="delete-group">
            <AppLink to={deleteUrl}>{deleteLabel}</AppLink>
          </DropdownItem>
        </DropdownList>
      </Dropdown>
    );

  const actionMenu = (
    <Fragment>
      {group?.platform_default && !group?.system && <DefaultGroupRestore onRestore={onResetWarning} />}
      {actionsDropdown}
    </Fragment>
  );

  return <PageHeader title={title} subtitle={(!isGroupLoading && group?.description) || undefined} actionMenu={actionMenu} />;
};
