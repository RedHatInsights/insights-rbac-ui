import React from 'react';
import PropTypes from 'prop-types';
import FilterToolbarItem from '../shared/filter-toolbar-item';

const PrincipalsFilterToolbar = ({ onFilterChange, filterValue, ...props }) => (
  <FilterToolbarItem { ...props } searchValue={ filterValue } onFilterChange={ onFilterChange } placeholder={ 'Find a User' }/>
);

PrincipalsFilterToolbar.propTypes = {
  onFilterChange: PropTypes.func.isRequired,
  filterValue: PropTypes.string
};

export default PrincipalsFilterToolbar;
