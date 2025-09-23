import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { useFlag } from '@unleash/proxy-client-react';
import React, { FunctionComponent, useContext } from 'react';
import PermissionsContext, { PermissionsContextType } from '../../utilities/permissionsContext';
import { ActiveUsersAdminView } from './ActiveUsersAdminView';
import { ActiveUsersNonAdminView } from './ActiveUsersNonAdminView';

type ActiveUserProps = {
  linkDescription?: string;
  linkTitle?: string;
  children?: React.ReactNode;
};

export const ActiveUsers: FunctionComponent<ActiveUserProps> = ({ linkDescription, linkTitle, children }) => {
  const chrome = useChrome();
  const env = chrome.getEnvironment();
  const prefix = chrome.isProd() ? '' : `${env}.`;
  const { orgAdmin } = useContext(PermissionsContext) as PermissionsContextType;
  const isITLess = useFlag('platform.rbac.itless');
  return !isITLess && orgAdmin ? (
    <ActiveUsersAdminView linkDescription={linkDescription} linkTitle={linkTitle} prefix={prefix}>
      {children}
    </ActiveUsersAdminView>
  ) : (
    <ActiveUsersNonAdminView>{children}</ActiveUsersNonAdminView>
  );
};
