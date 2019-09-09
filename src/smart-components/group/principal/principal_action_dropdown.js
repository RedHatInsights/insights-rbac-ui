import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Dropdown, DropdownPosition, KebabToggle, DropdownItem } from '@patternfly/react-core';

export const PrincipalsActionsDropdown = ({ itemAction, anyItemsSelected, itemsSelected }) => {
  const [ isOpen, setOpen ] =  useState(false);

  const onAction = () => {
    return itemAction(itemsSelected);
  };

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
          isDisabled={ !anyItemsSelected }
          onClick={ onAction }
          aria-label="Remove products from portfolio"
          key="remove-products"
        >
          <span style={ { cursor: 'pointer' } }
            className= { `pf-c-dropdown__menu-item ${!anyItemsSelected ? 'disabled-color' : 'danger-color'}` }>
            Remove members
          </span>
        </DropdownItem>
      ] }
    />
  );
};

PrincipalsActionsDropdown.propTypes = {
  itemAction: PropTypes.func.isRequired,
  anyItemsSelected: PropTypes.bool.isRequired,
  itemsSelected: PropTypes.array.isRequired
};

