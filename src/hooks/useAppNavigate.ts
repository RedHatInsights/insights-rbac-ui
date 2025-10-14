import { NavigateOptions, To, useNavigate } from 'react-router-dom';
import { useAppLink } from './useAppLink';
import { useWorkspacesFlag } from './useWorkspacesFlag';

type AppNavigate = (to: To, options?: NavigateOptions) => void;

const useAppNavigate = (linkBasename?: string): AppNavigate => {
  const navigate = useNavigate();
  const isWorkspacesFlag = useWorkspacesFlag('m5'); // Master flag
  const toAppLink = useAppLink();

  return (to: To, options?: NavigateOptions) => {
    return navigate(toAppLink(to, linkBasename || (isWorkspacesFlag ? '/iam/access-management' : undefined)), options);
  };
};

export default useAppNavigate;
