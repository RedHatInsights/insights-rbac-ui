import React, { Fragment, useState } from 'react';
import { useEffect } from 'react';
import useBundleApps from './useBundleApps';
import useSearchParams from '../../hooks/useSearchParams';

const Placeholder = () => Fragment;
const MuaBundleRoute = () => {
  const { bundle } = useSearchParams('bundle');
  const apps = useBundleApps(bundle);
  const [bundleComponents, setBundleComponents] = useState({});

  useEffect(() => {
    if (!Object.prototype.hasOwnProperty.call(bundleComponents, bundle)) {
      import(`./bundles/${bundle}`).then((module) => setBundleComponents((prev) => ({ ...prev, [bundle]: module.default }))).catch(console.log);
    }
  }, [bundle]);

  const CurrentBundle = bundleComponents[bundle] || Placeholder;
  return <CurrentBundle key={bundle} apps={apps} />;
};

export default MuaBundleRoute;
