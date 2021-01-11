import React from 'react';
import PropTypes from 'prop-types';
import CommonBundleView from '../CommonBundleView';

const InsightsBundle = ({ apps }) => <CommonBundleView apps={apps} />;

InsightsBundle.propTypes = {
  apps: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default InsightsBundle;
