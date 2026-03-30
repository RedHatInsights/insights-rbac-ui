import React, { useId, useState } from 'react';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { Menu } from '@patternfly/react-core';
import { MenuContainer } from '@patternfly/react-core';
import { MenuContent } from '@patternfly/react-core';
import { MenuItem } from '@patternfly/react-core';
import { MenuList } from '@patternfly/react-core';
import { MenuToggle } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import type { WorkspaceActionItem } from './useWorkspaceActionItems';

interface WorkspaceActionsProps {
  isDisabled?: boolean;
  items: WorkspaceActionItem[];
}

export const WorkspaceActions: React.FC<WorkspaceActionsProps> = ({ isDisabled = false, items }) => {
  const menuId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const toggleRef = React.useRef<HTMLButtonElement>(null);

  const toggle = (
    <MenuToggle ref={toggleRef} onClick={() => setIsOpen(!isOpen)} isExpanded={isOpen} isDisabled={isDisabled} variant="default">
      Actions
    </MenuToggle>
  );

  const menu = (
    <Menu ref={menuRef} id={menuId}>
      <MenuContent>
        <MenuList>
          {items.map((item) =>
            item.isSeparator ? (
              <Divider component="li" key={item.key} />
            ) : (
              <MenuItem
                key={item.key}
                itemId={item.key}
                isDisabled={item.isDisabled}
                isDanger={item.isDanger}
                onClick={() => {
                  setIsOpen(false);
                  item.onClick();
                }}
              >
                {item.label}
              </MenuItem>
            ),
          )}
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
