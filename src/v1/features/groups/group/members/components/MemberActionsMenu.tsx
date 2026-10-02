import React from 'react';
import { useIntl } from 'react-intl';
import { ActionDropdown } from '../../../../../../shared/components/ActionDropdown';

import type { Member, MemberTableRow } from '../types';
import { commonMessages } from '../../../../../../shared/messages/common';

interface MemberActionsMenuProps {
  selectedRows: MemberTableRow[];
  onRemoveMembers: (members: Member[]) => void;
}

export const MemberActionsMenu: React.FC<MemberActionsMenuProps> = ({ selectedRows, onRemoveMembers }) => {
  const intl = useIntl();

  return (
    <ActionDropdown
      ariaLabel="Member bulk actions"
      ouiaId="member-bulk-actions"
      items={[
        {
          key: 'remove-members',
          label: intl.formatMessage(commonMessages.remove),
          onClick: () => {
            if (selectedRows.length > 0) {
              onRemoveMembers(selectedRows.map((row) => row.member));
            }
          },
          isDisabled: selectedRows.length === 0,
        },
      ]}
    />
  );
};
