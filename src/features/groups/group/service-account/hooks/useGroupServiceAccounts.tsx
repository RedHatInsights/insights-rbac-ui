import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSearchParams, useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Dropdown, DropdownItem, DropdownList } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { MenuToggle } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import EllipsisVIcon from '@patternfly/react-icons/dist/js/icons/ellipsis-v-icon';
import { useDataViewFilters, useDataViewSelection } from '@patternfly/react-data-view';
import { fetchServiceAccountsForGroup } from '../../../../../redux/groups/actions';
import {
  selectGroupServiceAccounts,
  selectGroupServiceAccountsMeta,
  selectIsAdminDefaultGroup,
  selectIsChangedDefaultGroup,
  selectIsGroupServiceAccountsLoading,
  selectIsPlatformDefaultGroup,
  selectSelectedGroup,
  selectSystemGroupUUID,
} from '../../../../../redux/groups/selectors';
import { DEFAULT_ACCESS_GROUP_ID } from '../../../../../utilities/constants';
import PermissionsContext from '../../../../../utilities/permissionsContext';
import useAppNavigate from '../../../../../hooks/useAppNavigate';
import messages from '../../../../../Messages';
import pathnames from '../../../../../utilities/pathnames';
// import { mergeToBasename } from '../../../../../helpers/mergeToBasename';
import type { GroupServiceAccountsProps, ServiceAccount } from '../types';

// Row actions dropdown for individual service accounts
const ServiceAccountRowActions: React.FC<{
  account: ServiceAccount;
  onRemove: (account: ServiceAccount) => void;
  hasPermissions: boolean;
  isAdminDefault: boolean;
}> = ({ account, onRemove, hasPermissions, isAdminDefault }) => {
  const intl = useIntl();
  const [isOpen, setIsOpen] = useState(false);

  // Default groups don't have actions
  if (!hasPermissions || isAdminDefault) {
    return null;
  }

  const onToggle = (isOpen: boolean) => {
    setIsOpen(isOpen);
  };

  const onSelect = () => {
    setIsOpen(false);
  };

  const handleRemove = () => {
    onRemove(account);
    onSelect();
  };

  return (
    <Dropdown
      isOpen={isOpen}
      onSelect={onSelect}
      onOpenChange={(isOpen: boolean) => onToggle(isOpen)}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          aria-label={`Actions for service account ${account.name}`}
          variant="plain"
          onClick={() => onToggle(!isOpen)}
          isExpanded={isOpen}
        >
          <EllipsisVIcon />
        </MenuToggle>
      )}
      shouldFocusToggleOnSelect
    >
      <DropdownList>
        <DropdownItem key="remove" onClick={handleRemove}>
          {intl.formatMessage(messages.remove)}
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
};

// Types
interface GroupServiceAccountTableRow {
  id: string;
  row: (string | React.ReactElement)[];
  item: ServiceAccount;
}

interface GroupServiceAccountDataViewFilters {
  clientId: string;
  name: string;
  description: string;
}

// Hook return interface
export interface UseGroupServiceAccountsReturn {
  // Core data
  serviceAccounts: ServiceAccount[];
  isLoading: boolean;
  pagination: any;

  // DataView hooks
  filters: ReturnType<typeof useDataViewFilters<GroupServiceAccountDataViewFilters>>;
  selection: ReturnType<typeof useDataViewSelection>;

  // Computed values
  tableRows: GroupServiceAccountTableRow[];
  columns: Array<{ cell: string }>;
  hasActiveFilters: boolean;

  // Permission states
  hasPermissions: boolean;
  isAdminDefault: boolean;
  isPlatformDefault: boolean;
  isChanged: boolean;

  // Group data
  groupId: string | undefined;
  systemGroupUuid: string | undefined;
  group: any; // Group object from Redux

  // Actions
  fetchData: (apiProps?: Record<string, unknown>) => void;

  // Action resolvers
  actionResolver: (account: ServiceAccount) => Array<{ title: string; onClick: () => void }>;
  toolbarButtons: React.ReactElement[];

  // Empty state props
  emptyStateProps: {
    colSpan: number;
    hasActiveFilters: boolean;
    title: string;
    description: string;
  };

  // Callbacks for parent
  onDefaultGroupChanged?: GroupServiceAccountsProps['onDefaultGroupChanged'];
}

export const useGroupServiceAccounts = ({ groupId, onDefaultGroupChanged }: GroupServiceAccountsProps): UseGroupServiceAccountsReturn => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const { groupId: paramGroupId } = useParams<{ groupId: string }>();
  const actualGroupId = groupId || paramGroupId;
  const { userAccessAdministrator, orgAdmin } = useContext(PermissionsContext);
  const hasPermissions = orgAdmin || userAccessAdministrator;

  // Dropdown state for bulk actions
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Redux selectors - using memoized selectors to prevent unnecessary re-renders
  const serviceAccounts = useSelector(selectGroupServiceAccounts);
  const pagination = useSelector(selectGroupServiceAccountsMeta);
  const isLoading = useSelector(selectIsGroupServiceAccountsLoading);
  const isAdminDefault = useSelector(selectIsAdminDefaultGroup);
  const systemGroupUuid = useSelector(selectSystemGroupUUID);
  const isPlatformDefault = useSelector(selectIsPlatformDefaultGroup);
  const isChanged = useSelector(selectIsChangedDefaultGroup);
  const group = useSelector(selectSelectedGroup);

  // DataView hooks
  const filters = useDataViewFilters<GroupServiceAccountDataViewFilters>({
    initialFilters: { clientId: '', name: '', description: '' },
  });

  const selection = useDataViewSelection({
    matchOption: (a, b) => a.id === b.id,
  });

  // Fetch service accounts for group
  const fetchGroupAccounts = useCallback(
    (actualGroupId: string, options: Record<string, unknown>) => dispatch(fetchServiceAccountsForGroup(actualGroupId, options)),
    [dispatch],
  );

  const fetchData = useCallback(
    (apiProps: Record<string, unknown> = {}) => {
      const config = {
        ...pagination,
        ...apiProps,
        // Include current filter values unless explicitly overridden
        // Based on API logs, the Redux action maps clientId to principal_username
        principal_username: apiProps.clientId !== undefined ? apiProps.clientId : filters.filters.clientId,
        service_account_name:
          apiProps.service_account_name !== undefined
            ? apiProps.service_account_name
            : apiProps.name !== undefined
              ? apiProps.name
              : filters.filters.name,
        service_account_description:
          apiProps.service_account_description !== undefined
            ? apiProps.service_account_description
            : apiProps.description !== undefined
              ? apiProps.description
              : filters.filters.description,
      };
      if (actualGroupId !== DEFAULT_ACCESS_GROUP_ID) {
        fetchGroupAccounts(actualGroupId!, config);
      } else {
        systemGroupUuid && fetchGroupAccounts(systemGroupUuid, config);
      }
    },
    [systemGroupUuid, actualGroupId, pagination, fetchGroupAccounts, filters.filters],
  );

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [systemGroupUuid]);

  // Action resolver for table rows
  const actionResolver = useCallback(
    (account: ServiceAccount) => [
      ...(hasPermissions && !isAdminDefault
        ? [
            {
              title: intl.formatMessage(messages.remove),
              onClick: () =>
                navigate({
                  pathname: pathnames['group-service-accounts-remove-group'].link.replace(':groupId', actualGroupId!),
                  search: createSearchParams({ name: account.uuid }).toString(),
                }),
            },
          ]
        : []),
    ],
    [hasPermissions, isAdminDefault, intl, navigate, actualGroupId],
  );

  // Handle bulk remove of selected service accounts
  const handleRemoveSelectedServiceAccounts = useCallback(async () => {
    if (!selection.selected || selection.selected.length === 0) {
      return;
    }

    const searchParams = createSearchParams();
    selection.selected.forEach((selectedRow: GroupServiceAccountTableRow) => {
      // selectedRow.item contains the actual ServiceAccount object
      const account = selectedRow.item;
      if (account?.uuid) {
        searchParams.append('uuid', account.uuid);
      }
    });

    navigate({
      pathname: pathnames['group-service-accounts-remove-group'].link.replace(':groupId', actualGroupId!),
      search: searchParams.toString(),
    });
  }, [selection.selected, serviceAccounts, navigate, actualGroupId]);

  // Handle individual service account remove
  const handleRemoveServiceAccount = useCallback(
    (account: ServiceAccount) => {
      navigate({
        pathname: pathnames['group-service-accounts-remove-group'].link.replace(':groupId', actualGroupId!),
        search: createSearchParams({
          uuid: account.uuid,
        }).toString(),
      });
    },
    [navigate, actualGroupId],
  );

  // Table rows with JSX elements
  const tableRows = useMemo((): GroupServiceAccountTableRow[] => {
    if (!serviceAccounts) return [];

    return serviceAccounts.map((account): GroupServiceAccountTableRow => {
      const ownerItem = serviceAccounts.find((item: ServiceAccount) => item.uuid === account.uuid);
      const owner = (ownerItem as Record<string, unknown>)?.owner || '';

      const baseRow = [
        account.name,
        account.clientId || '',
        owner as string,
        // Date formatting - simplified for DataView
        account.time_created ? new Date(account.time_created).toLocaleDateString() : '',
      ];

      // Add actions column if permissions allow
      const rowWithActions =
        hasPermissions && !isAdminDefault && !isPlatformDefault
          ? [
              ...baseRow,
              <ServiceAccountRowActions
                key={`${account.uuid}-actions`}
                account={account}
                onRemove={handleRemoveServiceAccount}
                hasPermissions={hasPermissions}
                isAdminDefault={isAdminDefault}
              />,
            ]
          : baseRow;

      const rowData = {
        id: account.uuid,
        row: rowWithActions,
        item: account,
      };
      return rowData;
    });
  }, [serviceAccounts, hasPermissions, isAdminDefault, isPlatformDefault, handleRemoveServiceAccount]);

  // Column definitions
  const columns = useMemo(
    () => [
      { cell: intl.formatMessage(messages.name) },
      { cell: intl.formatMessage(messages.clientId) },
      { cell: intl.formatMessage(messages.owner) },
      { cell: intl.formatMessage(messages.timeCreated) },
      ...(hasPermissions && !isAdminDefault && !isPlatformDefault ? [{ cell: 'Actions' }] : []),
    ],
    [intl, hasPermissions, isAdminDefault, isPlatformDefault],
  );

  // Toolbar buttons
  const toolbarButtons = useMemo(() => {
    const buttons: React.ReactElement[] = [];

    if (hasPermissions && !isAdminDefault && !isPlatformDefault) {
      // Add service account button
      buttons.push(
        <Button
          key="add-service-account"
          variant="primary"
          ouiaId="add-service-account-button"
          onClick={() => {
            navigate(pathnames['group-add-service-account'].link.replace(':groupId', actualGroupId!));
          }}
        >
          {intl.formatMessage(messages.addServiceAccount)}
        </Button>,
      );

      // Always show bulk actions dropdown for admins, but disable actions when no selection
      const hasSelection = selection.selected && selection.selected.length > 0;
      buttons.push(
        <Dropdown
          key="bulk-actions"
          isOpen={isDropdownOpen}
          onSelect={() => setIsDropdownOpen(false)}
          onOpenChange={setIsDropdownOpen}
          toggle={(toggleRef) => (
            <MenuToggle
              ref={toggleRef}
              aria-label="bulk actions toggle"
              variant="plain"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              // Keep toggle enabled so users can always open dropdown
            >
              <EllipsisVIcon />
            </MenuToggle>
          )}
          shouldFocusToggleOnSelect
        >
          <DropdownList>
            <DropdownItem
              key="remove"
              onClick={() => {
                handleRemoveSelectedServiceAccounts();
                setIsDropdownOpen(false);
              }}
              isDisabled={!hasSelection}
            >
              {intl.formatMessage(messages.remove)}
            </DropdownItem>
          </DropdownList>
        </Dropdown>,
      );
    }

    return buttons;
  }, [
    hasPermissions,
    isAdminDefault,
    isPlatformDefault,
    actualGroupId,
    selection.selected?.length,
    intl,
    navigate,
    isDropdownOpen,
    handleRemoveSelectedServiceAccounts,
  ]);

  // Computed values
  const hasActiveFilters = Object.values(filters.filters).some((value) => value !== '');

  // Empty state props
  const emptyStateProps = {
    colSpan: columns.length,
    hasActiveFilters,
    title: intl.formatMessage(messages.noGroupAccounts),
    description: intl.formatMessage(isAdminDefault ? messages.contactServiceTeamForAccounts : messages.addAccountsToThisGroup),
  };

  return {
    serviceAccounts,
    isLoading,
    pagination,
    filters,
    selection,
    tableRows,
    columns,
    hasActiveFilters,
    hasPermissions,
    isAdminDefault,
    isPlatformDefault,
    isChanged,
    groupId: actualGroupId,
    systemGroupUuid,
    group,
    fetchData,
    actionResolver,
    toolbarButtons,
    emptyStateProps,
    onDefaultGroupChanged,
  };
};
