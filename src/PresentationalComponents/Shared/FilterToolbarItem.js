import React from 'react';
import propTypes from 'prop-types';
import { ToolbarGroup, ToolbarItem, Button, TextInput } from '@patternfly/react-core';

const FilterToolbarItem = ({ searchValue, onFilterChange, placeholder }) => (
  <ToolbarGroup className="searchToolbar">
    <ToolbarItem>
      <div className="pf-c-input-group">
        <TextInput placeholder={ placeholder } value={ searchValue } type="text" onChange={ onFilterChange }
          aria-label="Find product button"></TextInput>
        <Button variant="tertiary" id="searchProductButton" onClick={ () => onFilterChange(searchValue) }>
          <i className="fas fa-search" aria-hidden="true"></i>
        </Button>
      </div>
    </ToolbarItem>
  </ToolbarGroup>
);

FilterToolbarItem.propTypes = {
  onFilterChange: propTypes.func.isRequired,
  placeholder: propTypes.string,
  searchValue: propTypes.string
};

FilterToolbarItem.defaultProps = {
  searchValue: ''
};

export default FilterToolbarItem;
