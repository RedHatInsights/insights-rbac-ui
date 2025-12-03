import React from 'react';
import { useIntl } from 'react-intl';
import { ActionDropdown } from '../../../../../components/ActionDropdown';
import messages from '../../../../../Messages';

import type { Member, MemberTableRow } from '../types';

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
          label: intl.formatMessage(messages.remove),
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
