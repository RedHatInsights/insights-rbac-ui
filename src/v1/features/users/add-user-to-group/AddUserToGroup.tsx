import useUserData from '../../../hooks/useUserData';
import React, { Fragment, useState } from 'react';
import { useIntl } from 'react-intl';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Modal } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { ModalVariant } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';

import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import useAppNavigate from '../../../../shared/hooks/useAppNavigate';
import { TableView } from '@redhat-cloud-services/frontend-components/TableView';
import { useTableState } from '@redhat-cloud-services/frontend-components/TableView';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '@redhat-cloud-services/frontend-components/TableView';
import { useAddMembersToGroupMutation, useGroupsQuery } from '../../../../shared/data/queries/groups';

import pathnames from '../../../utilities/pathnames';
import { getModalContainer } from '../../../../shared/helpers/modal-container';
import type { ColumnConfigMap, FilterConfig } from '@redhat-cloud-services/frontend-components/TableView';
import { commonMessages } from '../../../../shared/messages/common';

interface AddUserToGroupProps {
  username?: string;
}

interface Group {
  uuid: string;
  name: string;
  description?: string;
  platform_default?: boolean;
  admin_default?: boolean;
}

const COLUMNS = ['name', 'description'] as const;

const AddUserToGroup: React.FC<AddUserToGroupProps> = ({ username }) => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const addNotification = useAddNotification();

  const [cancelWarningVisible, setCancelWarningVisible] = useState(false);
  const { orgAdmin, userAccessAdministrator } = useUserData();
  const isAdmin = orgAdmin || userAccessAdministrator;

  // Query params state for React Query
  const [queryParams, setQueryParams] = useState({
    limit: 20,
    offset: 0,
    name: '' as string | undefined,
    excludeUsername: username, // Only show groups user is NOT in
  });

  // React Query for groups data
  const { data: groupsData, isLoading } = useGroupsQuery(queryParams);
  const groups: Group[] = (groupsData?.data ?? []) as Group[];
  const pagination = groupsData?.meta;

  // React Query mutation for adding members
  const addMembersMutation = useAddMembersToGroupMutation();

  // Table state
  const tableState = useTableState({
    columns: COLUMNS,
    getRowId: (row: Group) => row.uuid,
    initialPerPage: 20,
    initialFilters: { name: '' },
    onStaleData: ({ filters, limit, offset }) => {
      setQueryParams({
        limit,
        offset,
        name: (filters.name as string) || undefined,
        excludeUsername: username,
      });
    },
  });

  const onSubmit = async () => {
    try {
      for (const group of tableState.selectedRows) {
        await addMembersMutation.mutateAsync({
          groupId: group.uuid,
          usernames: [username!],
        });
      }
      // Success notification is handled by the mutation
    } catch (error) {
      console.error('Failed to add user to group:', error);
      // Error notification is handled by the mutation
    }
    navigate(pathnames['user-detail'].link(username!), { state: { username } });
  };

  const onCancel = () => (tableState.selectedRows.length > 0 && setCancelWarningVisible(true)) || redirectToUserDetail();

  const redirectToUserDetail = () => {
    addNotification({
      variant: 'warning',
      title: intl.formatMessage({
        id: 'addingGroupMemberTitle',
        defaultMessage: 'Adding member to group',
        description: 'Adding group member notification title',
      }),
      description: intl.formatMessage({
        id: 'addingGroupMemberCancelled',
        defaultMessage: 'Adding member to group was canceled by the user.',
        description: 'Adding group member cancelled notification description',
      }),
    });
    navigate(pathnames['user-detail'].link(username!));
  };

  // Column config
  const columnConfig: ColumnConfigMap<typeof COLUMNS> = {
    name: { label: intl.formatMessage(commonMessages.name) },
    description: { label: intl.formatMessage(commonMessages.description) },
  };

  // Cell renderers
  const cellRenderers = {
    name: (row: Group) => <span aria-label={`group-name-${row.uuid}`}>{row.name}</span>,
    description: (row: Group) => row.description || '',
  };

  // Filter config
  const filterConfig: FilterConfig[] = [
    {
      type: 'search',
      id: 'name',
      placeholder: intl.formatMessage(commonMessages.name).toLowerCase(),
    },
  ];

  // Determine if a row is selectable (admin/platform default groups are not selectable)
  const isRowSelectable = (row: Group) => !row.platform_default && !row.admin_default;

  return (
    <Fragment>
      <WarningModal
        title={intl.formatMessage(
          { id: 'exitItemAdding', defaultMessage: 'Exit {item} adding?', description: 'Exit item adding modal title' },
          { item: intl.formatMessage(commonMessages.users).toLocaleLowerCase() },
        )}
        isOpen={cancelWarningVisible}
        onClose={() => setCancelWarningVisible(false)}
        confirmButtonLabel={intl.formatMessage(commonMessages.discard)}
        onConfirm={redirectToUserDetail}
      >
        {intl.formatMessage({ id: 'changesWillBeLost', defaultMessage: 'All changes will be lost', description: 'All changes will be lost message' })}
      </WarningModal>
      <Modal
        appendTo={getModalContainer()}
        variant={ModalVariant.medium}
        isOpen={!cancelWarningVisible}
        title={intl.formatMessage(
          { id: 'addSpecificUserToGroup', defaultMessage: 'Add {username} to a group', description: 'Add user to a group wizard title' },
          { username },
        )}
        onClose={onCancel}
        actions={[
          <Button
            aria-label="Save"
            className="pf-v6-u-mr-sm"
            ouiaId="primary-save-button"
            variant="primary"
            key="save"
            onClick={onSubmit}
            isDisabled={tableState.selectedRows.length === 0}
          >
            {intl.formatMessage({ id: 'addToGroup', defaultMessage: 'Add to group', description: 'Add to group label' })}
          </Button>,
          <Button aria-label="Cancel" ouiaId="secondary-cancel-button" variant="link" key="cancel" onClick={onCancel}>
            {intl.formatMessage(commonMessages.cancel)}
          </Button>,
        ]}
      >
        <Alert
          variant="info"
          isInline
          title={intl.formatMessage({
            id: 'onlyNonUserGroupsVisible',
            defaultMessage: 'This group list has been filtered to only show groups that the user is not currently a member of.',
            description: 'Message warning that only groups that the user is not a member of has been filtered',
          })}
          className="pf-v6-u-mb-md"
        />
        <TableView
          columns={COLUMNS}
          columnConfig={columnConfig}
          data={isLoading ? undefined : groups}
          totalCount={pagination?.count || 0}
          getRowId={(row) => row.uuid}
          cellRenderers={cellRenderers}
          variant="compact"
          // Pagination
          page={tableState.page}
          perPage={tableState.perPage}
          onPageChange={tableState.onPageChange}
          onPerPageChange={tableState.onPerPageChange}
          // Selection
          selectable={isAdmin}
          selectedRows={tableState.selectedRows}
          onSelectRow={tableState.onSelectRow}
          onSelectAll={tableState.onSelectAll}
          isRowSelectable={isRowSelectable}
          // Filtering
          filterConfig={filterConfig}
          filters={tableState.filters}
          onFiltersChange={tableState.onFiltersChange}
          clearAllFilters={tableState.clearAllFilters}
          // Empty states
          emptyStateNoData={
            <DefaultEmptyStateNoData title={intl.formatMessage({ id: 'noGroups', defaultMessage: 'No groups', description: 'No groups label' })} />
          }
          emptyStateNoResults={
            <DefaultEmptyStateNoResults
              title={intl.formatMessage(commonMessages.noMatchingItemsFound, { items: intl.formatMessage(commonMessages.groups).toLowerCase() })}
              body={intl.formatMessage(commonMessages.tryChangingFilters)}
              onClearFilters={tableState.clearAllFilters}
            />
          }
          ouiaId="available-user-groups-table"
          ariaLabel={intl.formatMessage(commonMessages.groups)}
        />
      </Modal>
    </Fragment>
  );
};

// Feature component (used by Routing.tsx) - both named and default exports
export { AddUserToGroup };
export default AddUserToGroup;
