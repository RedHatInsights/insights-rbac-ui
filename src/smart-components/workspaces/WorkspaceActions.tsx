import React, { useState } from 'react';
import { Divider, DrilldownMenu, Menu, MenuContainer, MenuContent, MenuItem, MenuItemAction, MenuList, MenuToggle } from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import { useIntl } from 'react-intl';
import Messages from '../../Messages';

enum ActionType {
  EDIT_WORKSPACE = 'EDIT_WORKSPACE',
  GRANT_ACCESS = 'GRANT_ACCESS',
  CREATE_SUBWORKSPACE = 'CREATE_SUBWORKSPACE',
  VIEW_TENANT = 'VIEW_TENANT',
  MANAGE_NOTIFICATIONS = 'MANAGE_NOTIFICATIONS',
  DELETE_WORKSPACE = 'DELETE_WORKSPACE',
  DUMMY_ACTION = 'DUMMY_ACTION',
}

interface WorkspaceActionsProps {
  isDisabled?: boolean;
}

const WorkspaceActions: React.FC<WorkspaceActionsProps> = (props) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const toggleRef = React.useRef<HTMLButtonElement>(null);
  const [menuDrilledIn, setMenuDrilledIn] = React.useState<string[]>([]);
  const [drilldownPath, setDrilldownPath] = React.useState<string[]>([]);
  const [menuHeights, setMenuHeights] = React.useState<Record<string, number>>({});
  const [activeMenu, setActiveMenu] = React.useState<string>('workspaceActions-rootMenu');
  const intl = useIntl();

  const toggle = (
    <MenuToggle ref={toggleRef} onClick={() => setIsOpen(!isOpen)} isExpanded={isOpen} isDisabled={props.isDisabled} variant="default">
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
    console.log('Dispatched action: ', action);
    setIsOpen(!isOpen);
  };

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
          <MenuItem onClick={() => dispatchAction(ActionType.EDIT_WORKSPACE)} itemId="edit_workspace">
            {intl.formatMessage(Messages.workspacesActionEditWorkspace)}
          </MenuItem>
          <MenuItem onClick={() => dispatchAction(ActionType.GRANT_ACCESS)} itemId="grant_access">
            {intl.formatMessage(Messages.workspacesActionGrantAccessToWorkspace)}
          </MenuItem>
          <MenuItem onClick={() => dispatchAction(ActionType.CREATE_SUBWORKSPACE)} itemId="create_subworkspace">
            {intl.formatMessage(Messages.workspacesActionCreateSubWorkspace)}
          </MenuItem>
          <MenuItem onClick={() => dispatchAction(ActionType.VIEW_TENANT)} itemId="view_tenant">
            {intl.formatMessage(Messages.workspacesActionViewTenant)}
          </MenuItem>
          <MenuItem
            itemId="group:manage_integrations"
            direction="down"
            drilldownMenu={
              <DrilldownMenu id="drilldown-drilldownMenuStart">
                <MenuItem itemId="group:manage_integrations_breadcrumb" direction="up">
                  {intl.formatMessage(Messages.workspacesActionManageIntegrations)}
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
            {intl.formatMessage(Messages.workspacesActionManageIntegrations)}
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
            {intl.formatMessage(Messages.workspacesActionManageNotifications)}
          </MenuItem>
          <MenuItem onClick={() => dispatchAction(ActionType.DELETE_WORKSPACE)} itemId="delete_workspace">
            {intl.formatMessage(Messages.workspacesActionDeleteWorkspace)}
          </MenuItem>
        </MenuList>
      </MenuContent>
    </Menu>
  );

  return (
    <MenuContainer
      isOpen={isOpen}
      onOpenChange={(isOpen) => setIsOpen(isOpen)}
      menu={menu}
      menuRef={menuRef}
      toggle={toggle}
      toggleRef={toggleRef}
      popperProps={{ position: 'end' }}
    />
  );
};

export default WorkspaceActions;
