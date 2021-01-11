import React from 'react';
import PropTypes from 'prop-types';
import FilterToolbarItem from '../shared/filter-toolbar-item';

const PoliciesFilterToolbar = ({ onFilterChange, filterValue, ...props }) => (
  <FilterToolbarItem { ...props } searchValue={ filterValue } onFilterChange={ onFilterChange } placeholder={ 'Find a Group' }/>
);

PoliciesFilterToolbar.propTypes = {
  onFilterChange: PropTypes.func.isRequired,
  filterValue: PropTypes.string
};

export default PoliciesFilterToolbar;
