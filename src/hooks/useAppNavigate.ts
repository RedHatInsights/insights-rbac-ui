import { NavigateOptions, To, useNavigate } from 'react-router-dom';
import { useAppLink } from './useAppLink';
import { useFlag } from '@unleash/proxy-client-react';

type AppNavigate = (to: To, options?: NavigateOptions) => void;

const useAppNavigate = (linkBasename?: string): AppNavigate => {
  const navigate = useNavigate();
  const isWorkspacesFlag = useFlag('platform.rbac.workspaces');
  const toAppLink = useAppLink();

  return (to: To, options?: NavigateOptions) => {
    return navigate(toAppLink(to, linkBasename || (isWorkspacesFlag ? '/iam/access-management' : undefined)), options);
  };
};

export default useAppNavigate;
