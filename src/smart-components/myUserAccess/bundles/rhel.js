import React from 'react';
import PropTypes from 'prop-types';
import CommonBundleView from '../CommonBundleView';

const RhelBundle = ({ apps }) => <CommonBundleView apps={apps} />;

RhelBundle.propTypes = {
  apps: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default RhelBundle;
