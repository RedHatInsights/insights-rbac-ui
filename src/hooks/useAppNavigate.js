import { useNavigate } from 'react-router-dom';
import { mergeToBasename } from '../presentational-components/shared/AppLink';

const useAppNavigate = (linkBasename) => {
  const navigate = useNavigate();

  return (to, options) => {
    return navigate(mergeToBasename(to, linkBasename), options);
  };
};

export default useAppNavigate;
