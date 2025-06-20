import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { useFlag } from '@unleash/proxy-client-react';
import React, { FunctionComponent, useContext } from 'react';
import PermissionsContext from '../../utilities/permissions-context';
import { ActiveUsersAdminView } from './ActiveUsersAdminView';
import { ActiveUsersNonAdminView } from './ActiveUsersNonAdminView';

type ActiveUserProps = {
  linkDescription?: string;
  linkTitle?: string;
};

const ActiveUser: FunctionComponent<ActiveUserProps> = ({ linkDescription, linkTitle }) => {
  const chrome = useChrome();
  const env = chrome.getEnvironment();
  const prefix = chrome.isProd() ? '' : `${env}.`;
  const { orgAdmin } = useContext(PermissionsContext);
  const isITLess = useFlag('platform.rbac.itless');
  return !isITLess && orgAdmin ? (
    <ActiveUsersAdminView linkDescription={linkDescription} linkTitle={linkTitle} prefix={prefix} />
  ) : (
    <ActiveUsersNonAdminView />
  );
};

export default ActiveUser;
