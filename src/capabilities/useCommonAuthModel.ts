import { useFlag } from '@unleash/proxy-client-react';

export function useCommonAuthModel() {
  const isEnabled = useFlag('platform.rbac.common-auth-model');
  const advancedPermissions = useFlag('platform.rbac.common-auth-model_advanced-permissions');
  return { isEnabled, advancedPermissions };
}
