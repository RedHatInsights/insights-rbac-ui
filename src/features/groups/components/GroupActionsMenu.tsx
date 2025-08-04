import React from 'react';
import { Button, Dropdown, DropdownItem, DropdownList, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
import { EllipsisVIcon, PlusIcon } from '@patternfly/react-icons';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';
import type { GroupActionsMenuProps } from '../types';

export const GroupActionsMenu: React.FC<GroupActionsMenuProps> = ({ selectedRows, onCreateGroup, onEditGroup, onDeleteGroups }) => {
  const intl = useIntl();
  const [isOpen, setIsOpen] = React.useState(false);

  const onToggle = (isOpen: boolean) => {
    setIsOpen(isOpen);
  };

  const onSelect = () => {
    setIsOpen(false);
  };

  const handleEditGroup = () => {
    if (selectedRows.length === 1) {
      onEditGroup(selectedRows[0].uuid);
    }
    onSelect();
  };

  const handleDeleteGroups = () => {
    if (selectedRows.length > 0) {
      onDeleteGroups(selectedRows.map((row) => row.uuid));
    }
    onSelect();
  };

  return (
    <div className="pf-v5-u-display-flex pf-v5-u-gap-sm pf-v5-u-align-items-center">
      {/* Create Group button - always visible for admins */}
      <Button variant="primary" icon={<PlusIcon />} onClick={onCreateGroup} ouiaId="create-group-button">
        {intl.formatMessage(messages.createGroup)}
      </Button>

      {/* Bulk actions dropdown - always visible, actions disabled when no rows selected */}
      <Dropdown
        isOpen={isOpen}
        onSelect={onSelect}
        onOpenChange={(isOpen: boolean) => onToggle(isOpen)}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle ref={toggleRef} aria-label="Group bulk actions" variant="plain" onClick={() => onToggle(!isOpen)} isExpanded={isOpen}>
            <EllipsisVIcon />
          </MenuToggle>
        )}
        shouldFocusToggleOnSelect
      >
        <DropdownList>
          <DropdownItem key="edit" onClick={handleEditGroup} isDisabled={selectedRows.length !== 1}>
            {intl.formatMessage(messages.edit)}
          </DropdownItem>
          <DropdownItem key="delete" onClick={handleDeleteGroups} isDisabled={selectedRows.length === 0}>
            {intl.formatMessage(messages.delete)}
          </DropdownItem>
        </DropdownList>
      </Dropdown>
    </div>
  );
};
