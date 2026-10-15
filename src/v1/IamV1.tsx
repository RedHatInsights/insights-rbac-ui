import React from 'react';
import useUserData from './hooks/useUserData';
import { AppPlaceholder } from '../shared/components/ui-states/LoaderPlaceholders';
import { V1Routing } from './Routing';

/**
 * V1 app shell — User Access.
 * Blocks rendering until useUserData resolves (Chrome auth is cached,
 * so children see near-instant resolution). No PermissionsContext needed —
 * V1 components call useUserData() directly.
 */
export const IamV1: React.FC = () => {
  const { ready } = useUserData();

  if (!ready) {
    return <AppPlaceholder />;
  }

  return (
    <section className="rbac-c-root pf-v6-c-page__main-section pf-v6-u-m-0 pf-v6-u-p-0">
      <V1Routing />
    </section>
  );
};
