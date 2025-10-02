import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { Dropdown, DropdownItem, DropdownList } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { MenuToggle } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import EllipsisVIcon from '@patternfly/react-icons/dist/js/icons/ellipsis-v-icon';
import messages from '../../../../../Messages';

import type { Member, MemberTableRow } from '../types';

interface MemberActionsMenuProps {
  selectedRows: MemberTableRow[];
  onRemoveMembers: (members: Member[]) => void;
}

export const MemberActionsMenu: React.FC<MemberActionsMenuProps> = ({ selectedRows, onRemoveMembers }) => {
  const intl = useIntl();
  const [isOpen, setIsOpen] = useState(false);

  const handleRemoveMembers = () => {
    if (selectedRows.length > 0) {
      onRemoveMembers(selectedRows.map((row) => row.member));
    }
    setIsOpen(false);
  };

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      toggle={(toggleRef) => (
        <MenuToggle ref={toggleRef} aria-label="Kebab toggle" variant="plain" onClick={() => setIsOpen(!isOpen)}>
          <EllipsisVIcon />
        </MenuToggle>
      )}
    >
      <DropdownList>
        <DropdownItem key="remove-members" onClick={handleRemoveMembers} isDisabled={selectedRows.length === 0}>
          {intl.formatMessage(messages.remove)}
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
};
