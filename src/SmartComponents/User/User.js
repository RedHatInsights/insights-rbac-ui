import React from 'react';
import {
  DataListItem,
  DataListCell,
  DataListToggle,
  DataListContent,
  DataListCheck,
  DataListAction
} from '@patternfly/react-core';

import propTypes from 'prop-types';
import ItemDetails from '../../PresentationalComponents/Shared/DetailCommon';

const TO_DISPLAY = [ 'groups' ];

const User = ({ userData, isExpanded, toggle }) => (
  <DataListItem aria-labelledby={ userData.name } isExpanded={ isExpanded }>
    <DataListToggle
      onClick={ () => toggle(userData.name) }
      isExpanded={ isExpanded }
      id={ userData.id }
      aria-labelledby={ userData.name }
      aria-label="Details"
    />
    <DataListCheck aria-labelledby={ userData.name } name={ 'Check_'.concat(userData.id) } />
    <DataListCell>
      <div id={ userData.id }>{ userData.name } { userData.email } </div>
      <a href="#">link</a>
    </DataListCell>
    <DataListCell>
      <span>{ userData.groups } </span>
    </DataListCell>
    <DataListAction aria-labelledby="Edit" id= { 'Edit' + userData.id } aria-label="Actions" />
    <DataListContent aria-label="Details" isHidden= { !isExpanded }>
      <p>
        <ItemDetails { ...this.props } toDisplay={ TO_DISPLAY } />
      </p>
    </DataListContent>
  </DataListItem>
);

User.propTypes = {
  history: propTypes.object,
  name: propTypes.string,
  userData: propTypes.object,
  isExpanded: propTypes.bool,
  toggle: propTypes.func.isRequired
};

export default User;

