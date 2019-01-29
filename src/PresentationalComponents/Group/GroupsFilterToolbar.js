import React from 'react';
import { Toolbar } from '@patternfly/react-core';
import PropTypes from 'prop-types';
import FilterToolbarItem from '../Shared/FilterToolbarItem';
import '../Shared/toolbarschema.scss';

const GroupsFilterToolbar = ({ onFilterChange, filterValue, ...props }) => (
  <Toolbar className="searchToolbar">
    <FilterToolbarItem { ...props } searchValue={ filterValue } onFilterChange={ onFilterChange } placeholder={ 'Find a Group' }/>
  </Toolbar>
);

GroupsFilterToolbar.propTypes = {
  onFilterChange: PropTypes.func.isRequired,
  filterValue: PropTypes.string
};

export default GroupsFilterToolbar;
