import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Modal } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { ModalVariant } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { FormattedMessage, useIntl } from 'react-intl';
import { UserGroupsTable } from '../../user-groups/components/UserGroupsTable';
import { type Group, useAddMembersToGroupMutation, useGroupsQuery } from '../../../../../data/queries/groups';
import messages from '../../../../../Messages';
import { getModalContainer } from '../../../../../helpers/modal-container';
import type { User } from '../../../../../data/queries/users';
import { useTableState } from '../../../../../components/table-view/hooks/useTableState';
import { type SortableColumnId, columns as userGroupsColumns } from '../../user-groups/components/useUserGroupsTableConfig';

interface AddUserToGroupModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedUsers: User[];
}

export const AddUserToGroupModal: React.FunctionComponent<AddUserToGroupModalProps> = ({ isOpen, setIsOpen, selectedUsers }) => {
  // Use useTableState for all table state management including selection (no URL sync for modals)
  const tableState = useTableState<typeof userGroupsColumns, Group, SortableColumnId>({
    columns: userGroupsColumns,
    sortableColumns: ['name', 'principalCount', 'modified'] as const,
    initialSort: { column: 'name', direction: 'asc' },
    initialPerPage: 10,
    initialFilters: { name: '' },
    getRowId: (group) => group.uuid,
    syncWithUrl: false, // Modal tables shouldn't sync with URL
  });

  const intl = useIntl();

  // Use React Query for data fetching with apiParams from tableState
  const { data, isLoading } = useGroupsQuery(
    {
      limit: tableState.apiParams.limit,
      offset: tableState.apiParams.offset,
      orderBy: tableState.apiParams.orderBy,
      name: (tableState.apiParams.filters.name as string) || undefined,
      system: false,
    },
    { enabled: isOpen },
  );

  // Use React Query mutation for adding members
  const addMembersMutation = useAddMembersToGroupMutation();

  // Extract groups from response
  const groups: Group[] = (data as any)?.data || [];
  const totalCount = (data as any)?.meta?.count || 0;

  const handleCloseModal = () => {
    setIsOpen(false);
    tableState.clearSelection();
  };

  const handleAddUsers = async () => {
    const selectedUsernames = selectedUsers.map((user) => user.username);
    // selectedRows contains Group objects with proper typing
    try {
      for (const group of tableState.selectedRows) {
        await addMembersMutation.mutateAsync({
          groupId: group.uuid,
          usernames: selectedUsernames,
        });
      }
    } catch (error) {
      console.error('Failed to add users to group:', error);
      // Error notification is handled by the mutation hook
    }
    handleCloseModal();
  };

  return (
    <Modal
      appendTo={getModalContainer()}
      variant={ModalVariant.medium}
      title={intl.formatMessage(messages['addToUserGroup'])}
      isOpen={isOpen}
      onClose={handleCloseModal}
      actions={[
        <Button
          key="add"
          variant="primary"
          onClick={handleAddUsers}
          isDisabled={tableState.selectedRows.length === 0}
          isLoading={addMembersMutation.isPending}
        >
          {intl.formatMessage(messages['usersAndUserGroupsAdd'])}
        </Button>,
        <Button key="cancel" variant="link" onClick={handleCloseModal}>
          {intl.formatMessage(messages['usersAndUserGroupsCancel'])}
        </Button>,
      ]}
      ouiaId="add-user-group-modal"
    >
      <FormattedMessage
        {...messages['usersAndUserGroupsAddUserDescription']}
        values={{
          b: (text) => <b>{text}</b>,
          numUsers: selectedUsers.length,
          plural: selectedUsers.length > 1 ? 'users' : 'user',
        }}
      />
      <UserGroupsTable
        groups={groups}
        totalCount={totalCount}
        isLoading={isLoading}
        ouiaId="iam-add-users-modal-table"
        enableActions={true}
        tableState={tableState}
      />
    </Modal>
  );
};

// Component uses named export only
