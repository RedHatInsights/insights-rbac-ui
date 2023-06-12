export const validateNextAddRolePermissionStep = (currentStep, values) => {
  const permissions = (values && values['add-permissions-table']) || [];
  const hasCostPermissions = permissions.some(({ uuid }) => uuid.split(':')[0].includes('cost-management'));
  const hasInventoryPermissions = permissions.some(({ uuid }) => uuid.split(':')[0].includes('inventory'));

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
