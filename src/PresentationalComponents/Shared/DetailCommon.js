import React from 'react';
import PropTypes from 'prop-types';

// This whole thing is a bit strange
const PropLine = ({ value }) => <div className = "card_element">{ value }</div>;

PropLine.propTypes = {
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.arrayOf(PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.node
    ]))
  ]).isRequired
};

const ItemDetails = ({ toDisplay = [], ...item }) => (
  <div>
    { toDisplay.map(prop => <PropLine key={ `prop-${prop}` } value={ item[prop] } />) }
  </div>
);

ItemDetails.propTypes = {
  toDisplay: PropTypes.arrayOf(PropTypes.string)
};

ItemDetails.defaultProps = {
  toDisplay: []
};

export default ItemDetails;
