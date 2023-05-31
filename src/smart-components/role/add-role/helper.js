export const validateNextAddRolePermissionStep = (currentStep, values) => {
  const permissions = (values && values['add-permissions-table']) || [];

  if (currentStep === 'add-permissions') {
    const hasCostPermissions = permissions.some(({ uuid }) => uuid.split(':')[0].includes('cost-management'));
    const hasInventoryPermissions = permissions.some(({ uuid }) => uuid.split(':')[0].includes('inventory'));

    if (hasCostPermissions && hasInventoryPermissions) {
      return 'cost-resources-definition';
    } else if (hasCostPermissions) {
      return 'cost-resources-definition';
    } else if (hasInventoryPermissions) {
      return 'inventory-groups-role';
    } else {
      return 'review';
    }
  } else if (currentStep === 'cost-resources-definition') {
    if (permissions.some(({ uuid }) => uuid.split(':')[0].includes('inventory'))) {
      return 'inventory-groups-role';
    } else {
      return 'review';
    }
  }

  return undefined;
};
