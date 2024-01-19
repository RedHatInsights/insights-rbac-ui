import { COST_MANAGEMENT_PREFIX, INVENTORY_PREFIX } from '../../utilities/constants';

export const validateNextAddRolePermissionStep = (currentStep, values) => {
  const permissions = (values && values['add-permissions-table']) || [];
  const hasCostPermissions = permissions.some(({ uuid }) => uuid.split(':')[0].includes(COST_MANAGEMENT_PREFIX));
  const hasInventoryPermissions = permissions.some(({ uuid }) => uuid.split(':')[0].includes(INVENTORY_PREFIX));

  if (currentStep === 'inventory-groups-role' && hasCostPermissions) return 'cost-resources-definition';

  if (currentStep === 'add-permissions' && hasInventoryPermissions) {
    return 'inventory-groups-role';
  }

  if (currentStep === 'add-permissions' && hasCostPermissions) {
    return 'cost-resources-definition';
  }

  return 'review';
};

// TODO: add step dictionary to replace literal strings across both add-role and add-role-permission
