import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Dropdown, DropdownPosition, KebabToggle, DropdownItem } from '@patternfly/react-core';

export const PrincipalsActionsDropdown = ({ action, anyItemsSelected, groupId, itemsSelected }) => {
  const [ isOpen, setOpen ] =  useState(false);
  console.log('DEBUG - principal dropdown - removeItems, itemsSelected: ', action, anyItemsSelected, groupId, itemsSelected);
  return (
    <Dropdown
      onSelect={ () => setOpen(false) }
      position={ DropdownPosition.right }
      toggle={ <KebabToggle id="remove-members-dropdown-toggle" onToggle={ open => setOpen(open) }/> }
      isOpen={ isOpen }
      isPlain
      dropdownItems={ [
        <DropdownItem
          id="action-item"
          isDisabled={ !anyItemsSelected() }
          onClick={ action(groupId, itemsSelected) }
          aria-label="Remove products from portfolio"
          key="remove-products"
        >
          <span style={ { cursor: 'pointer' } }
            className={ `pf-c-dropdown__menu-item ${!anyItemsSelected() ? 'disabled-color' : 'destructive-color'}` }>
            Remove members
          </span>
        </DropdownItem>
      ] }
    />
  );
};

PrincipalsActionsDropdown.propTypes = {
  action: PropTypes.func.isRequired,
  anyItemsSelected: PropTypes.func.isRequired,
  itemsSelected: PropTypes.array.isRequired,
  groupId: PropTypes.string.isRequired
};

