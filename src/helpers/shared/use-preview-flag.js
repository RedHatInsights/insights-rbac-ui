import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { useFlag } from '@unleash/proxy-client-react';

export const usePreviewFlag = (flag) => {
  const { isBeta, getEnvironment } = useChrome();
  const flagValue = useFlag(flag);

  if (getEnvironment() === 'prod' && isBeta() === false) {
    return false;
  }

  return flagValue;
};
