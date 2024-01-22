import { isCostPermission, isInventoryPermission } from './role-resource-definitions-table-helpers';

export const validateNextAddRolePermissionStep = (currentStep, values) => {
  const permissions = (values && values['add-permissions-table']) || [];
  const hasCostPermissions = permissions.some(({ uuid }) => isCostPermission(uuid));
  const hasInventoryPermissions = permissions.some(({ uuid }) => isInventoryPermission(uuid));

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
