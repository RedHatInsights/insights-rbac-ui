/**
 * ActionDropdown Component
 *
 * A reusable kebab menu dropdown for row actions and bulk actions.
 * Consolidates the repeated dropdown pattern found across table components.
 *
 * Features:
 * - Kebab (ellipsis) icon toggle
 * - Configurable action items with onClick, isDisabled, and labels
 * - OUIA IDs for testing
 * - Accessible aria-labels
 * - Auto-close on selection
 * - Focus management
 */

import React, { useState } from 'react';
import { Dropdown, DropdownItem, DropdownList } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { MenuToggle, MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import EllipsisVIcon from '@patternfly/react-icons/dist/js/icons/ellipsis-v-icon';

export interface ActionDropdownItem {
  /** Unique key for the action */
  key: string;
  /** Display label for the action */
  label: React.ReactNode;
  /** Click handler for the action */
  onClick: () => void;
  /** Whether the action is disabled */
  isDisabled?: boolean;
  /** Optional description for the action */
  description?: string;
  /** Whether this is a danger/destructive action */
  isDanger?: boolean;
  /** OUIA component ID for testing */
  ouiaId?: string;
}

export interface ActionDropdownProps {
  /** Array of action items to display in the dropdown */
  items: ActionDropdownItem[];
  /** Accessible label for the toggle button */
  ariaLabel: string;
  /** OUIA component ID for the dropdown (toggle will append '-toggle') */
  ouiaId?: string;
  /** Whether the dropdown is disabled */
  isDisabled?: boolean;
  /** Whether to focus the toggle on select (default: true) */
  shouldFocusToggleOnSelect?: boolean;
  /** Additional class name for the dropdown */
  className?: string;
  /** Position of the dropdown menu */
  position?: 'right' | 'left' | 'center' | 'start' | 'end';
}

export const ActionDropdown: React.FC<ActionDropdownProps> = ({
  items,
  ariaLabel,
  ouiaId,
  isDisabled = false,
  shouldFocusToggleOnSelect = true,
  className,
  position,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = () => {
    setIsOpen(false);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  // Don't render if no items
  if (items.length === 0) {
    return null;
  }

  return (
    <Dropdown
      isOpen={isOpen}
      onSelect={handleSelect}
      onOpenChange={setIsOpen}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          aria-label={ariaLabel}
          variant="plain"
          onClick={handleToggle}
          isExpanded={isOpen}
          isDisabled={isDisabled}
          data-ouia-component-id={ouiaId ? `${ouiaId}-toggle` : undefined}
        >
          <EllipsisVIcon />
        </MenuToggle>
      )}
      shouldFocusToggleOnSelect={shouldFocusToggleOnSelect}
      className={className}
      popperProps={position ? { position } : undefined}
      ouiaId={ouiaId}
    >
      <DropdownList>
        {items.map((item) => (
          <DropdownItem
            key={item.key}
            onClick={() => {
              if (item.isDisabled) return;
              item.onClick();
            }}
            isDisabled={item.isDisabled}
            description={item.description}
            isDanger={item.isDanger}
            data-ouia-component-id={item.ouiaId}
          >
            {item.label}
          </DropdownItem>
        ))}
      </DropdownList>
    </Dropdown>
  );
};

export default ActionDropdown;
