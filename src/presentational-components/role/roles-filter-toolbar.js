import React from 'react';
import PropTypes from 'prop-types';
import FilterToolbarItem from '../shared/filter-toolbar-item';

const RolesFilterToolbar = ({ onFilterChange, filterValue, ...props }) => (
  <FilterToolbarItem { ...props } searchValue={ filterValue } onFilterChange={ onFilterChange } placeholder={ 'Find a Role' }/>
);

RolesFilterToolbar.propTypes = {
  onFilterChange: PropTypes.func.isRequired,
  filterValue: PropTypes.string
};

export default RolesFilterToolbar;
