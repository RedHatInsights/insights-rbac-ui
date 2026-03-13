import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Drawer } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerActions } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerCloseButton } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerContent } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerContentBody } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerHead } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerPanelContent } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import KeyIcon from '@patternfly/react-icons/dist/js/icons/key-icon';
import { useGroupRolesQuery } from '../../../../shared/data/queries/groups';
import { extractErrorMessage } from '../../../../shared/utilities/errorUtils';
import { TableView, useTableState } from '../../../../shared/components/table-view';
import type { CellRendererMap, ColumnConfigMap } from '../../../../shared/components/table-view/types';
import messages from '../../../../Messages';

interface MyGroupDrawerProps {
  isOpen: boolean;
  groupId?: string;
  groupName?: string;
  groupDescription?: string;
  onClose: () => void;
  drawerRef: React.RefObject<HTMLDivElement>;
  children: React.ReactNode;
}

const roleColumns = ['name', 'workspace'] as const;

interface RoleData {
  uuid: string;
  display_name: string;
  workspace?: string;
}

const GroupRolesPanel: React.FC<{ groupId: string }> = ({ groupId }) => {
  const intl = useIntl();

  const columnConfig: ColumnConfigMap<typeof roleColumns> = useMemo(
    () => ({
      name: { label: intl.formatMessage(messages.roles) },
      workspace: { label: intl.formatMessage(messages.workspace) },
    }),
    [intl],
  );

  const cellRenderers: CellRendererMap<typeof roleColumns, RoleData> = useMemo(
    () => ({
      name: (role) => role.display_name,
      workspace: (role) => role.workspace || '—',
    }),
    [],
  );

  const tableState = useTableState<typeof roleColumns, RoleData>({
    columns: roleColumns,
    getRowId: (role) => role.uuid,
    initialPerPage: 100,
    syncWithUrl: false,
  });

  const { data, isLoading, error } = useGroupRolesQuery(groupId, {
    limit: tableState.apiParams.limit,
  });
  const roles = data?.roles ?? [];

  if (error) {
    return (
      <div className="pf-v6-u-pt-md">
        <EmptyState headingLevel="h4" icon={ExclamationCircleIcon} titleText="Unable to load roles" variant="sm">
          <EmptyStateBody>{extractErrorMessage(error)}</EmptyStateBody>
        </EmptyState>
      </div>
    );
  }

  const roleData: RoleData[] = roles.map((role) => ({
    uuid: role.uuid,
    display_name: role.display_name ?? role.name,
    workspace: role.workspace,
  }));

  const emptyState = (
    <EmptyState headingLevel="h4" icon={KeyIcon} titleText="No roles found" variant="sm">
      <EmptyStateBody>{intl.formatMessage(messages.groupNoRolesAssigned)}</EmptyStateBody>
    </EmptyState>
  );

  return (
    <div className="pf-v6-u-pt-md">
      <TableView<typeof roleColumns, RoleData>
        {...tableState}
        columns={roleColumns}
        columnConfig={columnConfig}
        data={isLoading ? undefined : roleData}
        totalCount={roleData.length}
        getRowId={(role) => role.uuid}
        cellRenderers={cellRenderers}
        ariaLabel="Group roles"
        ouiaId="my-group-drawer-roles"
        emptyStateNoData={emptyState}
        emptyStateNoResults={emptyState}
      />
    </div>
  );
};

const MyGroupDrawer: React.FunctionComponent<MyGroupDrawerProps> = ({
  isOpen,
  groupId,
  groupName,
  groupDescription,
  onClose,
  drawerRef,
  children,
}) => (
  <Drawer isExpanded={isOpen} onExpand={() => drawerRef.current?.focus()} data-ouia-component-id="my-group-drawer">
    <DrawerContent
      panelContent={
        <DrawerPanelContent data-testid="detail-drawer-panel">
          <DrawerHead>
            <Title headingLevel="h2">
              <span tabIndex={isOpen ? 0 : -1} ref={drawerRef}>
                {groupName}
              </span>
            </Title>
            {groupDescription && <p className="pf-v6-u-mt-sm pf-v6-u-color-200">{groupDescription}</p>}
            <DrawerActions>
              <DrawerCloseButton onClick={onClose} />
            </DrawerActions>
          </DrawerHead>
          {groupId && <GroupRolesPanel groupId={groupId} />}
        </DrawerPanelContent>
      }
    >
      <DrawerContentBody hasPadding>{children}</DrawerContentBody>
    </DrawerContent>
  </Drawer>
);

export { MyGroupDrawer };
