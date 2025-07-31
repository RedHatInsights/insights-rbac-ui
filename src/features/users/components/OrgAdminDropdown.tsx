import { Dropdown, DropdownItem, DropdownList, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

interface OrgAdminDropdownProps {
  isOrgAdmin: boolean;
  username: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  onToggle: (isOrgAdmin: boolean, username: string) => Promise<void> | void;
}

export const OrgAdminDropdown: React.FC<OrgAdminDropdownProps> = ({ isOrgAdmin, username, isDisabled = false, isLoading = false, onToggle }) => {
  const intl = useIntl();
  const [isOpen, setIsOpen] = useState(false);

  const onToggleClick = () => {
    if (isLoading || isDisabled) return;
    setIsOpen((prev) => !prev);
  };

  const onSelect = async (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
    if (isLoading || isDisabled) return;

    const newStatus = value === 'true';
    if (newStatus === isOrgAdmin) {
      setIsOpen(false);
      return;
    }

    await onToggle(newStatus, username);
    setIsOpen(false);
  };

  return (
    <Dropdown
      isOpen={isOpen}
      onSelect={onSelect}
      onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          onClick={onToggleClick}
          isExpanded={isOpen}
          isDisabled={isDisabled || isLoading}
          data-testid="org-admin-dropdown-toggle"
        >
          {isOrgAdmin ? intl.formatMessage(messages.yes) : intl.formatMessage(messages.no)}
        </MenuToggle>
      )}
      ouiaId="OrgAdminDropdown"
      shouldFocusToggleOnSelect
    >
      <DropdownList>
        <DropdownItem value="true" key="yes" data-testid="org-admin-yes">
          {intl.formatMessage(messages.yes)}
        </DropdownItem>
        <DropdownItem value="false" key="no" data-testid="org-admin-no">
          {intl.formatMessage(messages.no)}
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
};
