import React, { useState } from 'react';
import { useEffect } from 'react';
import useSearchParams from '../../hooks/useSearchParams';

const Placeholder = () => <div>Loading</div>;
const MuaBundleRoute = () => {
  const { bundle } = useSearchParams('bundle');
  const [bundleComponents, setBundleComponents] = useState({});

  useEffect(() => {
    if (!Object.prototype.hasOwnProperty.call(bundleComponents, bundle)) {
      import(`./bundles/${bundle}`)
        .then((module) => setBundleComponents((prev) => ({ ...prev, [bundle]: module.default })))
        .catch(console.log);
    }
  }, [bundle]);

  const CurrentBundle = bundleComponents[bundle] || Placeholder;
  return <CurrentBundle />;
};

export default MuaBundleRoute;
