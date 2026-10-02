import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import PlusIcon from '@patternfly/react-icons/dist/js/icons/plus-icon';
import { useIntl } from 'react-intl';
import { ActionDropdown } from '../../../../shared/components/ActionDropdown';

import type { GroupActionsMenuProps } from '../types';
import { commonMessages } from '../../../../shared/messages/common';

export const GroupActionsMenu: React.FC<GroupActionsMenuProps> = ({ selectedRows, onCreateGroup, onEditGroup, onDeleteGroups }) => {
  const intl = useIntl();

  return (
    <div className="pf-v6-u-display-flex pf-v6-u-gap-sm pf-v6-u-align-items-center">
      {/* Create Group button - always visible for admins */}
      <Button variant="primary" icon={<PlusIcon />} onClick={onCreateGroup} ouiaId="create-group-button">
        {intl.formatMessage({ id: 'createGroup', defaultMessage: 'Create group', description: 'Create group wizard title' })}
      </Button>

      {/* Bulk actions dropdown - always visible, actions disabled when no rows selected */}
      <ActionDropdown
        ariaLabel="Group bulk actions"
        ouiaId="group-bulk-actions"
        items={[
          {
            key: 'edit',
            label: intl.formatMessage(commonMessages.edit),
            onClick: () => {
              if (selectedRows.length === 1) {
                onEditGroup(selectedRows[0].uuid);
              }
            },
            isDisabled: selectedRows.length !== 1,
          },
          {
            key: 'delete',
            label: intl.formatMessage(commonMessages.delete),
            onClick: () => {
              if (selectedRows.length > 0) {
                onDeleteGroups(selectedRows.map((row) => row.uuid));
              }
            },
            isDisabled: selectedRows.length === 0,
          },
        ]}
      />
    </div>
  );
};
