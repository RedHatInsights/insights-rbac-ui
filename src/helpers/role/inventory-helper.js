import { getInventoryGroupsApi } from '../shared/user-login';
import { useFlag } from '@unleash/proxy-client-react';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';

const inventoryGroupsApi = getInventoryGroupsApi();

export const getInventoryGroups = async (apiProps) => {
  return await inventoryGroupsApi.getInventoryGroups(apiProps);
};

export const enableWorkspacesNameChange = useChrome.isBeta() && useFlag('platform.rbac.groups-to-workspaces-rename');
