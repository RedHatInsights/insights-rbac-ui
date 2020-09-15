import React from 'react';
import { useContext } from 'react';
import OrgAdminContext from '../../../utilities/org-admin-context';
import MUAAccessTable from '../MUAAccessTable';
import MUARolesTable from '../MUARolesTable';

const InsightsBundle = () => {
  const isOrgAdmin = useContext(OrgAdminContext);
  return isOrgAdmin ? <MUARolesTable /> : <MUAAccessTable />;
};

export default InsightsBundle;
