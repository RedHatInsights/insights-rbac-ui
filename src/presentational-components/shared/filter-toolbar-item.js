import React from 'react';
import propTypes from 'prop-types';
import { SearchIcon } from '@patternfly/react-icons';
import { ToolbarGroup, ToolbarItem, TextInput } from '@patternfly/react-core';

const FilterToolbarItem = ({ isCompact, searchValue, onFilterChange, placeholder }) => (
  <ToolbarGroup>
    <ToolbarItem>
      <div className={ `toolbar-filter-input-group${isCompact ? '-c' : ''}` }>
        <TextInput
          placeholder={ placeholder }
          value={ searchValue }
          type="text"
          onChange={ onFilterChange }
          aria-label={ placeholder }
        />
        <SearchIcon />
      </div>
    </ToolbarItem>
  </ToolbarGroup>
);

FilterToolbarItem.propTypes = {
  onFilterChange: propTypes.func.isRequired,
  placeholder: propTypes.string,
  searchValue: propTypes.string,
  isCompact: propTypes.bool
};

FilterToolbarItem.defaultProps = {
  searchValue: '',
  isCompact: false
};

export default FilterToolbarItem;
