import { NavigateOptions, To, useNavigate } from 'react-router-dom';
import { useAppLink } from './useAppLink';

type AppNavigate = (to: To, options?: NavigateOptions) => void;

/**
 * Hook for navigation with the /iam basename.
 * Uses useAppLink which defaults to /iam basename.
 */
const useAppNavigate = (): AppNavigate => {
  const navigate = useNavigate();
  const toAppLink = useAppLink();

  return (to: To, options?: NavigateOptions) => {
    return navigate(toAppLink(to), options);
  };
};

export default useAppNavigate;
