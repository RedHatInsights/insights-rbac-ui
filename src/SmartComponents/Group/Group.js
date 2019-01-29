import React, { Component } from 'react';
import propTypes from 'prop-types';
import ItemDetails from '../../PresentationalComponents/Shared/DetailCommon';
import { GridItem } from '@patternfly/react-core';

const TO_DISPLAY = [ 'description', 'members' ];

class Group extends Component {
  render() {
    return (
      <GridItem sm={ 6 } md={ 4 } lg={ 4 } xl={ 3 }>
        <div>
          <h4>{ this.props.name }</h4>
          <ItemDetails { ...this.props } toDisplay={ TO_DISPLAY } />
        </div>
      </GridItem>
    );
  };
}

Group.propTypes = {
  history: propTypes.object,
  imageUrl: propTypes.string,
  name: propTypes.string,
  id: propTypes.string
};

export default Group;
