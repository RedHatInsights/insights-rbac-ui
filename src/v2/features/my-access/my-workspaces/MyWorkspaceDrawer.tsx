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
import { Flex, FlexItem } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { Label } from '@patternfly/react-core/dist/dynamic/components/Label';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import KeyIcon from '@patternfly/react-icons/dist/js/icons/key-icon';
import { useCurrentUserRoleBindingsQuery } from '../../../data/queries/roleBindings';
import { extractErrorMessage } from '../../../../shared/utilities/errorUtils';
import { TableView, useTableState } from '../../../../shared/components/table-view';
import type { CellRendererMap, ColumnConfigMap } from '../../../../shared/components/table-view/types';
import messages from '../../../../Messages';

interface MyWorkspaceDrawerProps {
  isOpen: boolean;
  workspaceId?: string;
  workspaceName?: string;
  workspaceDescription?: string;
  isAdmin: boolean;
  onClose: () => void;
  drawerRef: React.RefObject<HTMLDivElement>;
  children: React.ReactNode;
}

const roleColumns = ['name', 'description'] as const;

interface RoleData {
  id: string;
  name: string;
  description: string;
}

const WorkspaceRolesPanel: React.FC<{ workspaceId: string }> = ({ workspaceId }) => {
  const intl = useIntl();

  const columnConfig: ColumnConfigMap<typeof roleColumns> = useMemo(
    () => ({
      name: { label: intl.formatMessage(messages.roles) },
      description: { label: intl.formatMessage(messages.description) },
    }),
    [intl],
  );

  const cellRenderers: CellRendererMap<typeof roleColumns, RoleData> = useMemo(
    () => ({
      name: (role) => role.name,
      description: (role) => role.description || '—',
    }),
    [],
  );

  const tableState = useTableState<typeof roleColumns, RoleData>({
    columns: roleColumns,
    getRowId: (role) => role.id,
    initialPerPage: 100,
    syncWithUrl: false,
  });

  const { data: bindings = [], isLoading, error } = useCurrentUserRoleBindingsQuery({ resourceId: workspaceId });

  const roleData: RoleData[] = useMemo(() => {
    const seen = new Set<string>();
    return bindings.reduce<RoleData[]>((acc, binding) => {
      const id = binding.role.id;
      if (id && !seen.has(id)) {
        seen.add(id);
        acc.push({ id, name: binding.role.name || id, description: '' });
      }
      return acc;
    }, []);
  }, [bindings]);

  if (error) {
    return (
      <div className="pf-v6-u-pt-md">
        <EmptyState headingLevel="h4" icon={ExclamationCircleIcon} titleText="Unable to load roles" variant="sm">
          <EmptyStateBody>{extractErrorMessage(error)}</EmptyStateBody>
        </EmptyState>
      </div>
    );
  }

  const emptyState = (
    <EmptyState headingLevel="h4" icon={KeyIcon} titleText="No roles found" variant="sm">
      <EmptyStateBody>No roles are assigned to you in this workspace.</EmptyStateBody>
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
        getRowId={(role) => role.id}
        cellRenderers={cellRenderers}
        ariaLabel="Workspace roles"
        ouiaId="my-workspace-drawer-roles"
        emptyStateNoData={emptyState}
        emptyStateNoResults={emptyState}
      />
    </div>
  );
};

const MyWorkspaceDrawer: React.FunctionComponent<MyWorkspaceDrawerProps> = ({
  isOpen,
  workspaceId,
  workspaceName,
  workspaceDescription,
  isAdmin,
  onClose,
  drawerRef,
  children,
}) => {
  const intl = useIntl();

  return (
    <Drawer isExpanded={isOpen} onExpand={() => drawerRef.current?.focus()} data-ouia-component-id="my-workspace-drawer">
      <DrawerContent
        panelContent={
          <DrawerPanelContent data-testid="detail-drawer-panel">
            <DrawerHead>
              <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                <FlexItem>
                  <Title headingLevel="h2">
                    <span tabIndex={isOpen ? 0 : -1} ref={drawerRef}>
                      {workspaceName}
                    </span>
                  </Title>
                </FlexItem>
                <FlexItem>
                  <Label color={isAdmin ? 'purple' : 'blue'}>{intl.formatMessage(isAdmin ? messages.adminRole : messages.viewerRole)}</Label>
                </FlexItem>
              </Flex>
              {workspaceDescription && <p className="pf-v6-u-mt-sm pf-v6-u-color-200">{workspaceDescription}</p>}
              <DrawerActions>
                <DrawerCloseButton onClick={onClose} />
              </DrawerActions>
            </DrawerHead>
            {workspaceId && <WorkspaceRolesPanel workspaceId={workspaceId} />}
          </DrawerPanelContent>
        }
      >
        <DrawerContentBody hasPadding>{children}</DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};

export { MyWorkspaceDrawer };
