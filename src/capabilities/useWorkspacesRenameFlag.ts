import { useFlag } from '@unleash/proxy-client-react';

export function useWorkspacesRenameFlag(): boolean {
  return useFlag('platform.rbac.groups-to-workspaces-rename');
}
