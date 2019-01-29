import React, { Component } from 'react';
import propTypes from 'prop-types';
import ItemDetails from '../../PresentationalComponents/Shared/DetailCommon';
import { GridItem } from '@patternfly/react-core';

const TO_DISPLAY = [ 'description' ];

class User extends Component {
  render() {
    return (
      <GridItem sm={ 6 } md={ 4 } lg={ 4 } xl={ 3 }>
        <div className="card_body">
          <h4>{ this.props.name }</h4>
          <ItemDetails { ...this.props } toDisplay={ TO_DISPLAY } />
        </div>

      </GridItem>
    );
  };
}

User.propTypes = {
  history: propTypes.object,
  name: propTypes.string,
  id: propTypes.string,
};

export default User;
