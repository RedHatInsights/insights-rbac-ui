import React, { Suspense, useState } from 'react';
import { ButtonVariant } from '@patternfly/react-core';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { DrilldownMenu } from '@patternfly/react-core';
import { Menu } from '@patternfly/react-core';
import { MenuContainer } from '@patternfly/react-core';
import { MenuContent } from '@patternfly/react-core';
import { MenuItem } from '@patternfly/react-core';
import { MenuItemAction } from '@patternfly/react-core';
import { MenuList } from '@patternfly/react-core';
import { MenuToggle } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import {} from '@patternfly/react-core';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/js/icons/external-link-alt-icon';
import { FormattedMessage, useIntl } from 'react-intl';
import messages from '../../../Messages';
import { WarningModal } from '@patternfly/react-component-groups';
import { type WorkspacesWorkspace } from '../../../data/queries/workspaces';
import { Outlet } from 'react-router-dom';
import pathnames from '../../../utilities/pathnames';
import paths from '../../../utilities/pathnames';
import { useAppLink } from '../../../hooks/useAppLink';
import useAppNavigate from '../../../hooks/useAppNavigate';

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
  currentWorkspace: WorkspacesWorkspace;
  hasAssets: boolean;
}

export const WorkspaceActions: React.FC<WorkspaceActionsProps> = ({ isDisabled = false, currentWorkspace, hasAssets }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const toggleRef = React.useRef<HTMLButtonElement>(null);
  const [menuDrilledIn, setMenuDrilledIn] = React.useState<string[]>([]);
  const [drilldownPath, setDrilldownPath] = React.useState<string[]>([]);
  const [menuHeights, setMenuHeights] = React.useState<Record<string, number>>({});
  const [activeMenu, setActiveMenu] = React.useState<string>('workspaceActions-rootMenu');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
    console.log('Dispatched action: ', action);
    setIsOpen(!isOpen);
    if (action === ActionType.DELETE_WORKSPACE) {
      setIsDeleteModalOpen(true);
    }
    if (action === ActionType.EDIT_WORKSPACE) {
      navigate(paths['edit-workspace'].link.replace(':workspaceId', currentWorkspace.id ?? ''));
    }
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
            {intl.formatMessage(messages.workspacesActionEditWorkspace)}
          </MenuItem>
          <MenuItem onClick={() => dispatchAction(ActionType.GRANT_ACCESS)} itemId="grant_access">
            {intl.formatMessage(messages.workspacesActionGrantAccessToWorkspace)}
          </MenuItem>
          <MenuItem onClick={() => dispatchAction(ActionType.CREATE_SUBWORKSPACE)} itemId="create_subworkspace">
            {intl.formatMessage(messages.workspacesActionCreateSubWorkspace)}
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
          <MenuItem onClick={() => dispatchAction(ActionType.DELETE_WORKSPACE)} itemId="delete_workspace">
            {intl.formatMessage(messages.workspacesActionDeleteWorkspace)}
          </MenuItem>
        </MenuList>
      </MenuContent>
    </Menu>
  );

  return (
    <React.Fragment>
      {isDeleteModalOpen && (
        <WarningModal
          ouiaId={'remove-workspaces-modal'}
          isOpen={isDeleteModalOpen}
          title={intl.formatMessage(messages.deleteWorkspaceModalHeader)}
          confirmButtonLabel={!hasAssets ? intl.formatMessage(messages.delete) : intl.formatMessage(messages.gotItButtonLabel)}
          confirmButtonVariant={!hasAssets ? ButtonVariant.danger : ButtonVariant.primary}
          withCheckbox={!hasAssets}
          checkboxLabel={intl.formatMessage(messages.understandActionIrreversible)}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => {
            !hasAssets ? console.log('deleting workspaces') : null;
            setIsDeleteModalOpen(false);
          }}
          cancelButtonLabel={!hasAssets ? 'Cancel' : ''}
        >
          {hasAssets ? (
            intl.formatMessage(messages.workspaceNotEmptyWarning, { count: 1 })
          ) : (
            <FormattedMessage
              {...messages.deleteWorkspaceModalBody}
              values={{
                b: (text) => <b>{text}</b>,
                count: 1,
                name: currentWorkspace.name,
              }}
            />
          )}
        </WarningModal>
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
                navigate(toAppLink(paths['workspace-detail'].link.replace(':workspaceId', currentWorkspace.id ?? '')));
              },
              onCancel: () => {
                navigate(toAppLink(paths['workspace-detail'].link.replace(':workspaceId', currentWorkspace.id ?? '')));
              },
            },
          }}
        />
      </Suspense>
    </React.Fragment>
  );
};
