import messages from '../../Messages';

const INVENTORY_PREFIX = 'inventory';
const COST_MANAGEMENT_PREFIX = 'cost-management';
const HOSTS_TYPE = 'hosts';

export const isInventoryPermission = (permissionId) => permissionId.split(':')[0].includes(INVENTORY_PREFIX);
export const isInventoryHostsPermission = (permissionId) => isInventoryPermission(permissionId) && permissionId.split(':')[1].includes(HOSTS_TYPE);

export const isCostPermission = (permissionId) => permissionId.split(':')[0].includes(COST_MANAGEMENT_PREFIX) && !permissionId.includes('settings');

export const createRows = (data, permissionId, intl) => {
  if (!Array.isArray(data)) {
    return [];
  }
  let finalData = data.filter(Boolean);
  if (isInventoryHostsPermission(permissionId) && data.includes(null)) {
    finalData.unshift(intl.formatMessage(messages.ungroupedSystems));
  }
  return finalData.reduce(
    (acc, value) => [
      ...acc,
      {
        cells: [value],
      },
    ],
    [],
  );
};
