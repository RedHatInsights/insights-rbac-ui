import React from 'react';
import PropTypes from 'prop-types';
import { useFlag } from '@unleash/proxy-client-react';

import CommonBundleView from '../CommonBundleView';

const RhelBundle = ({ apps }) => {
  const isITLess = useFlag('platform.rbac.itless');
  const filteredApps = isITLess ? apps.filter((app) => app !== 'image-builder') : apps;

  return <CommonBundleView apps={filteredApps} />;
};

RhelBundle.propTypes = {
  apps: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default RhelBundle;
