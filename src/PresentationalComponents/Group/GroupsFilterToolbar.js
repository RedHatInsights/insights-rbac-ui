import React from 'react';
import PropTypes from 'prop-types';
import FilterToolbarItem from '../Shared/FilterToolbarItem';

const GroupsFilterToolbar = ({ onFilterChange, filterValue, ...props }) => (
  <FilterToolbarItem { ...props } searchValue={ filterValue } onFilterChange={ onFilterChange } placeholder={ 'Find a Group' }/>
);

GroupsFilterToolbar.propTypes = {
  onFilterChange: PropTypes.func.isRequired,
  filterValue: PropTypes.string
};

export default GroupsFilterToolbar;
