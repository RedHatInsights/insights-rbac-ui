import useUserData from '../../hooks/useUserData';
import { useFlag } from '@unleash/proxy-client-react';
import React, { FunctionComponent } from 'react';
import { usePlatformEnvironment } from '../../../shared/hooks/usePlatformEnvironment';
import { ActiveUsersAdminView } from './ActiveUsersAdminView';
import { ActiveUsersNonAdminView } from './ActiveUsersNonAdminView';

type ActiveUserProps = {
  linkDescription?: string;
  linkTitle?: string;
  children?: React.ReactNode;
};

export const ActiveUsers: FunctionComponent<ActiveUserProps> = ({ linkDescription, linkTitle, children }) => {
  const { environment } = usePlatformEnvironment();
  const prefix = environment === 'production' ? '' : `${environment}.`;
  const { orgAdmin } = useUserData();
  const isITLess = useFlag('platform.rbac.itless');
  return !isITLess && orgAdmin ? (
    <ActiveUsersAdminView linkDescription={linkDescription} linkTitle={linkTitle} prefix={prefix}>
      {children}
    </ActiveUsersAdminView>
  ) : (
    <ActiveUsersNonAdminView>{children}</ActiveUsersNonAdminView>
  );
};
