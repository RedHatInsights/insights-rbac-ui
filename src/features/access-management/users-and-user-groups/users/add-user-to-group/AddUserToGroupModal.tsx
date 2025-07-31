import React from 'react';
import { Button, Modal, ModalVariant } from '@patternfly/react-core';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDataViewSelection } from '@patternfly/react-data-view';
import { UserGroupsTable } from '../../user-groups/components/UserGroupsTable';
import { useDispatch, useSelector } from 'react-redux';
import { addMembersToGroup, fetchGroups } from '../../../../../redux/groups/actions';
import { RBACStore } from '../../../../../redux/store';
import messages from '../../../../../Messages';

interface AddUserToGroupModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedUsers: any[];
}

export const AddUserToGroupModal: React.FunctionComponent<AddUserToGroupModalProps> = ({ isOpen, setIsOpen, selectedUsers }) => {
  // Selection for the groups table
  const selection = useDataViewSelection({
    matchOption: (a: any, b: any) => a.id === b.id, // Match based on row id (group uuid)
  });

  // Get groups data from Redux
  const { groups, totalCount, isLoading } = useSelector((state: RBACStore) => ({
    groups: state.groupReducer?.groups?.data || [],
    totalCount: state.groupReducer?.groups?.meta.count || 0,
    isLoading: state.groupReducer?.isLoading || false,
  }));

  // Local state for modal - no URL management needed
  const [modalSort, setModalSort] = React.useState<{ sortBy: string; direction: 'asc' | 'desc' }>({ sortBy: 'name', direction: 'asc' });
  const [modalFilters, setModalFilters] = React.useState({ name: '' });
  const [modalPage, setModalPage] = React.useState(1);
  const [modalPerPage, setModalPerPage] = React.useState(10);

  // Selection is now handled by the selection object
  const dispatch = useDispatch();
  const intl = useIntl();

  // Fetch groups when modal opens
  React.useEffect(() => {
    if (isOpen) {
      dispatch(
        fetchGroups({
          limit: modalPerPage,
          offset: (modalPage - 1) * modalPerPage,
          orderBy: `${modalSort.direction === 'desc' ? '-' : ''}${modalSort.sortBy}` as any,
          filters: modalFilters,
          usesMetaInURL: false,
          system: false,
        }),
      );
    }
  }, [isOpen, modalPage, modalPerPage, modalSort, modalFilters, dispatch]);

  // Modal-specific handlers (no URL management) - will trigger refetch via useEffect
  const handleSort = (event: any, key: string, direction: 'asc' | 'desc') => {
    setModalSort({ sortBy: key, direction });
  };

  const handleSetFilters = (filters: Partial<{ name: string }>) => {
    setModalFilters((prev) => ({ ...prev, ...filters }));
    setModalPage(1); // Reset to first page when filtering
  };

  const handleClearFilters = () => {
    setModalFilters({ name: '' });
    setModalPage(1); // Reset to first page when clearing filters
  };

  const handleSetPage = (event: any, page: number) => {
    setModalPage(page);
  };

  const handleSetPerPage = (event: any, perPage: number) => {
    setModalPerPage(perPage);
    setModalPage(1); // Reset to first page when changing page size
  };

  const handleCloseModal = () => setIsOpen(false);

  const handleAddUsers = () => {
    const selectedUsernames = selectedUsers.map((user) => ({ username: user.username }));
    selection.selected.forEach((selectedRow: any) => {
      dispatch(addMembersToGroup(selectedRow.id, selectedUsernames)); // Use selectedRow.id instead of group.uuid
    });
    setIsOpen(false);
  };

  return (
    <Modal
      variant={ModalVariant.medium}
      title={intl.formatMessage(messages['addToUserGroup'])}
      isOpen={isOpen}
      onClose={handleCloseModal}
      actions={[
        <Button key="add" variant="primary" onClick={handleAddUsers} isDisabled={selection.selected.length === 0}>
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
        defaultPerPage={modalPerPage}
        ouiaId="iam-add-users-modal-table"
        selection={selection}
        enableActions={true} // Enable to show selection checkboxes
        // Data view state - managed locally in modal
        sortBy={modalSort.sortBy}
        direction={modalSort.direction}
        onSort={handleSort}
        filters={modalFilters}
        onSetFilters={handleSetFilters}
        clearAllFilters={handleClearFilters}
        page={modalPage}
        perPage={modalPerPage}
        onSetPage={handleSetPage}
        onPerPageSelect={handleSetPerPage}
        pagination={{}} // Minimal pagination object for compatibility
      />
    </Modal>
  );
};

// Component uses named export only
