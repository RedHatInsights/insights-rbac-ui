import { useNavigate } from 'react-router-dom';
import { mergeToBasename } from '../presentational-components/shared/AppLink';
import { useFlag } from '@unleash/proxy-client-react';

const useAppNavigate = (linkBasename) => {
  const navigate = useNavigate();
  const isWorkspacesFlag = useFlag('platform.rbac.workspaces');

  return (to, options) => {
    return navigate(mergeToBasename(to, linkBasename || isWorkspacesFlag ? '/iam/access-management' : undefined), options);
  };
};

export default useAppNavigate;
