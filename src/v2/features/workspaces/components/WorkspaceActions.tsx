import React, { Suspense, useState } from 'react';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { DrilldownMenu } from '@patternfly/react-core';
import { Menu } from '@patternfly/react-core';
import { MenuContainer } from '@patternfly/react-core';
import { MenuContent } from '@patternfly/react-core';
import { MenuItem } from '@patternfly/react-core';
import { MenuItemAction } from '@patternfly/react-core';
import { MenuList } from '@patternfly/react-core';
import { MenuToggle } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/js/icons/external-link-alt-icon';
import { useIntl } from 'react-intl';
import messages from '../../../../Messages';
import { EMPTY_PERMISSIONS, type WorkspacePermissions, type WorkspacesWorkspace } from '../../../data/queries/workspaces';
import { Outlet } from 'react-router-dom';
import pathnames from '../../../utilities/pathnames';
import { useAppLink } from '../../../../shared/hooks/useAppLink';
import useAppNavigate from '../../../../shared/hooks/useAppNavigate';
import { useWorkspacesFlag } from '../../../../shared/hooks/useWorkspacesFlag';
import { DeleteWorkspaceModal } from './DeleteWorkspaceModal';
import { MoveWorkspaceDialog } from './MoveWorkspaceDialog';
import { type TreeViewWorkspaceItem, instanceOfTreeViewWorkspaceItem } from './managed-selector/TreeViewWorkspaceItem';
import { WorkspacesWorkspaceTypes } from '../../../data/api/workspaces';

enum ActionType {
  EDIT_WORKSPACE = 'EDIT_WORKSPACE',
  GRANT_ACCESS = 'GRANT_ACCESS',
  CREATE_SUBWORKSPACE = 'CREATE_SUBWORKSPACE',
  MOVE_WORKSPACE = 'MOVE_WORKSPACE',
  VIEW_TENANT = 'VIEW_TENANT',
  MANAGE_NOTIFICATIONS = 'MANAGE_NOTIFICATIONS',
  DELETE_WORKSPACE = 'DELETE_WORKSPACE',
  DUMMY_ACTION = 'DUMMY_ACTION',
}

/** Convert a WorkspacesWorkspace to a TreeViewWorkspaceItem for the move dialog. */
const toTreeViewItem = (ws: WorkspacesWorkspace): TreeViewWorkspaceItem => ({
  name: ws.name ?? '',
  id: ws.id ?? '',
  workspace: {
    id: ws.id ?? '',
    name: ws.name ?? '',
    description: ws.description,
    type: (ws.type as WorkspacesWorkspaceTypes) ?? WorkspacesWorkspaceTypes.Standard,
    parent_id: ws.parent_id ?? '',
  },
  children: [],
});

interface WorkspaceActionsProps {
  isDisabled?: boolean;
  currentWorkspace: WorkspacesWorkspace;
  hasAssets: boolean;
  /** Per-workspace Kessel permissions. When absent, all actions are disabled (deny-by-default). */
  permissions?: WorkspacePermissions;
  /** All workspaces (needed by MoveWorkspaceDialog to find the current parent). */
  allWorkspaces?: WorkspacesWorkspace[];
  /** Callback fired when "Grant access" is selected from the actions menu. */
  onGrantAccess?: () => void;
  /** Callback fired when delete is confirmed. Consumer handles the mutation + navigation. */
  onDelete?: (workspace: WorkspacesWorkspace) => void;
  /** Callback fired when move is confirmed. Consumer handles the mutation. */
  onMove?: (workspace: WorkspacesWorkspace, targetParentId: string) => void;
}

export const WorkspaceActions: React.FC<WorkspaceActionsProps> = ({
  isDisabled = false,
  currentWorkspace,
  hasAssets,
  permissions,
  allWorkspaces = [],
  onGrantAccess,
  onDelete,
  onMove,
}) => {
  const perms = permissions ?? EMPTY_PERMISSIONS;
  const hasM4Flag = useWorkspacesFlag('m4');
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const toggleRef = React.useRef<HTMLButtonElement>(null);
  const [menuDrilledIn, setMenuDrilledIn] = React.useState<string[]>([]);
  const [drilldownPath, setDrilldownPath] = React.useState<string[]>([]);
  const [menuHeights, setMenuHeights] = React.useState<Record<string, number>>({});
  const [activeMenu, setActiveMenu] = React.useState<string>('workspaceActions-rootMenu');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

  const intl = useIntl();
  const navigate = useAppNavigate();
  const toAppLink = useAppLink();

  const toggle = (
    <MenuToggle ref={toggleRef} onClick={() => setIsOpen(!isOpen)} isExpanded={isOpen} isDisabled={isDisabled} variant="default">
      Actions
    </MenuToggle>
  );

  const drillIn = (_event: React.KeyboardEvent | React.MouseEvent, fromMenuId: string, toMenuId: string, pathId: string) => {
    setMenuDrilledIn([...menuDrilledIn, fromMenuId]);
    setDrilldownPath([...drilldownPath, pathId]);
    setActiveMenu(toMenuId);
  };

  const drillOut = (_event: React.KeyboardEvent | React.MouseEvent, toMenuId: string) => {
    const menuDrilledInSansLast = menuDrilledIn.slice(0, menuDrilledIn.length - 1);
    const pathSansLast = drilldownPath.slice(0, drilldownPath.length - 1);
    setMenuDrilledIn(menuDrilledInSansLast);
    setDrilldownPath(pathSansLast);
    setActiveMenu(toMenuId);
  };

  const setHeight = (menuId: string, height: number) => {
    if (menuHeights[menuId] === undefined || (menuId !== 'workspaceActions-rootMenu' && menuHeights[menuId] !== height)) {
      setMenuHeights({ ...menuHeights, [menuId]: height });
    }
  };

  const dispatchAction = (action: ActionType) => {
    setIsOpen(!isOpen);
    if (action === ActionType.DELETE_WORKSPACE) {
      setIsDeleteModalOpen(true);
    }
    if (action === ActionType.EDIT_WORKSPACE) {
      navigate(pathnames['edit-workspace'].link(currentWorkspace.id ?? ''));
    }
    if (action === ActionType.GRANT_ACCESS) {
      onGrantAccess?.();
    }
    if (action === ActionType.CREATE_SUBWORKSPACE) {
      navigate(pathnames['create-workspace'].link(), {
        state: { parentWorkspace: currentWorkspace },
      });
    }
    if (action === ActionType.MOVE_WORKSPACE) {
      setIsMoveModalOpen(true);
    }
  };

  const currentParent = allWorkspaces.find((ws) => ws.id === currentWorkspace.parent_id);
  const moveInitialSelection = currentParent ?? allWorkspaces.find((ws) => ws.type === 'root') ?? allWorkspaces[0];

  const menu = (
    <Menu
      ref={menuRef}
      id="workspaceActions-rootMenu"
      containsDrilldown
      drilldownItemPath={drilldownPath}
      drilledInMenus={menuDrilledIn}
      activeMenu={activeMenu}
      onDrillIn={drillIn}
      onDrillOut={drillOut}
      onGetMenuHeight={setHeight}
    >
      <MenuContent menuHeight={`${menuHeights[activeMenu]}px`}>
        <MenuList>
          <MenuItem onClick={() => dispatchAction(ActionType.EDIT_WORKSPACE)} itemId="edit_workspace" isDisabled={!perms.edit}>
            {intl.formatMessage(messages.workspacesActionEditWorkspace)}
          </MenuItem>
          {/* TODO: replace `create` with `role_binding_create` when role_binding_* relations ship */}
          <MenuItem onClick={() => dispatchAction(ActionType.GRANT_ACCESS)} itemId="grant_access" isDisabled={!perms.create || !hasM4Flag}>
            {intl.formatMessage(messages.workspacesActionGrantAccessToWorkspace)}
          </MenuItem>
          <MenuItem onClick={() => dispatchAction(ActionType.CREATE_SUBWORKSPACE)} itemId="create_subworkspace" isDisabled={!perms.create}>
            {intl.formatMessage(messages.workspacesActionCreateSubWorkspace)}
          </MenuItem>
          <MenuItem onClick={() => dispatchAction(ActionType.MOVE_WORKSPACE)} itemId="move_workspace" isDisabled={!perms.move}>
            {intl.formatMessage(messages.workspacesActionMoveWorkspace)}
          </MenuItem>
          <MenuItem onClick={() => dispatchAction(ActionType.VIEW_TENANT)} itemId="view_tenant">
            {intl.formatMessage(messages.workspacesActionViewTenant)}
          </MenuItem>
          <MenuItem
            itemId="group:manage_integrations"
            direction="down"
            drilldownMenu={
              <DrilldownMenu id="drilldown-drilldownMenuStart">
                <MenuItem itemId="group:manage_integrations_breadcrumb" direction="up">
                  {intl.formatMessage(messages.workspacesActionManageIntegrations)}
                </MenuItem>
                <Divider component="li" />
                <MenuItem
                  onClick={() => {
                    dispatchAction(ActionType.DUMMY_ACTION);
                  }}
                  itemId="menu_item_1"
                >
                  Menu Item 1
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    dispatchAction(ActionType.DUMMY_ACTION);
                  }}
                  itemId="menu_item_2"
                >
                  Menu Item 2
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    dispatchAction(ActionType.DUMMY_ACTION);
                  }}
                  itemId="menu_item_3"
                >
                  Menu Item 3
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    dispatchAction(ActionType.DUMMY_ACTION);
                  }}
                  itemId="menu_item_4"
                >
                  Menu Item 4
                </MenuItem>
              </DrilldownMenu>
            }
          >
            {intl.formatMessage(messages.workspacesActionManageIntegrations)}
          </MenuItem>
          <MenuItem
            onClick={() => dispatchAction(ActionType.MANAGE_NOTIFICATIONS)}
            actions={
              <MenuItemAction
                icon={<ExternalLinkAltIcon aria-hidden />}
                onClick={() => dispatchAction(ActionType.MANAGE_NOTIFICATIONS)}
                aria-label="Manage Notifications"
              />
            }
            itemId="manage_notifications"
          >
            {intl.formatMessage(messages.workspacesActionManageNotifications)}
          </MenuItem>
          <MenuItem onClick={() => dispatchAction(ActionType.DELETE_WORKSPACE)} itemId="delete_workspace" isDisabled={!perms.delete}>
            {intl.formatMessage(messages.workspacesActionDeleteWorkspace)}
          </MenuItem>
        </MenuList>
      </MenuContent>
    </Menu>
  );

  return (
    <React.Fragment>
      <DeleteWorkspaceModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          setIsDeleteModalOpen(false);
          onDelete?.(currentWorkspace);
        }}
        workspaces={[currentWorkspace]}
        hasAssets={hasAssets}
      />
      {isMoveModalOpen && moveInitialSelection && (
        <MoveWorkspaceDialog
          isOpen={isMoveModalOpen}
          onClose={() => setIsMoveModalOpen(false)}
          onSubmit={(destination) => {
            if (instanceOfTreeViewWorkspaceItem(destination) && destination.id) {
              setIsMoveModalOpen(false);
              onMove?.(currentWorkspace, destination.id);
            }
          }}
          workspaceToMove={currentWorkspace}
          availableWorkspaces={allWorkspaces}
          initialSelectedWorkspace={toTreeViewItem(moveInitialSelection)}
          sourceWorkspace={toTreeViewItem(currentWorkspace)}
        />
      )}
      <MenuContainer
        isOpen={isOpen}
        onOpenChange={(isOpen) => setIsOpen(isOpen)}
        menu={menu}
        menuRef={menuRef}
        toggle={toggle}
        toggleRef={toggleRef}
        popperProps={{ position: 'end' }}
      />
      <Suspense>
        <Outlet
          context={{
            [pathnames['edit-workspace'].path]: {
              afterSubmit: () => {
                navigate(toAppLink(pathnames['workspace-detail'].link(currentWorkspace.id ?? '')));
              },
              onCancel: () => {
                navigate(toAppLink(pathnames['workspace-detail'].link(currentWorkspace.id ?? '')));
              },
            },
          }}
        />
      </Suspense>
    </React.Fragment>
  );
};
