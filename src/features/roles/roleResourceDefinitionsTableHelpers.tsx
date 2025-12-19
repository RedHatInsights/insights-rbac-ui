import type { IntlShape } from 'react-intl';
import messages from '../../Messages';

const INVENTORY_PREFIX = 'inventory';
const COST_MANAGEMENT_PREFIX = 'cost-management';
const HOSTS_TYPE = 'hosts';

export const isInventoryPermission = (permissionId: string): boolean => permissionId.split(':')[0].includes(INVENTORY_PREFIX);
export const isInventoryHostsPermission = (permissionId: string): boolean =>
  isInventoryPermission(permissionId) && permissionId.split(':')[1].includes(HOSTS_TYPE);

export const isCostPermission = (permissionId: string): boolean =>
  permissionId.split(':')[0].includes(COST_MANAGEMENT_PREFIX) && !permissionId.includes('settings');

interface Row {
  cells: (string | null)[];
}

export const createRows = (data: (string | null)[], permissionId: string, intl: IntlShape): Row[] => {
  const finalData = data.filter(Boolean) as string[];
  if (isInventoryHostsPermission(permissionId) && data.includes(null)) {
    finalData.unshift(intl.formatMessage(messages.ungroupedSystems));
  }
  return finalData.reduce(
    (acc: Row[], value) => [
      ...acc,
      {
        cells: [value],
      },
    ],
    [],
  );
};
