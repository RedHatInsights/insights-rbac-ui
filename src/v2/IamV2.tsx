import React from 'react';
import { AccessCheck } from '@project-kessel/react-kessel-access-check';
import { V2Routing } from './Routing';

/**
 * V2 app shell — Access Management.
 * Wraps V2 routing with AccessCheck.Provider for Kessel permission resolution.
 */
export const IamV2: React.FC = () => {
  const accessCheckBaseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const accessCheckApiPath = '/api/kessel/v1beta2';

  return (
    <AccessCheck.Provider baseUrl={accessCheckBaseUrl} apiPath={accessCheckApiPath}>
      <section className="rbac-c-root pf-v6-c-page__main-section pf-v6-u-m-0 pf-v6-u-p-0">
        <V2Routing />
      </section>
    </AccessCheck.Provider>
  );
};
