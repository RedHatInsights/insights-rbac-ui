export const validateNextAddRolePermissionStep = ( currentStep, values ) => {
  const permissions = (values && values['add-permissions-table']) || [];
  const hasCostPermissions = permissions.some(({ uuid }) => uuid.split(':')[0].includes('cost-management'));
  const hasInventoryPermissions = permissions.some(({ uuid }) => uuid.split(':')[0].includes('inventory'));

  console.log('Testing out step validator -- values', values);
  console.log('Testing out step validator -- currentStep', currentStep);

  if(currentStep === "inventory-groups-role" && hasCostPermissions)
    return 'cost-resources';

  if(currentStep === "add-permissions" && hasInventoryPermissions)
    return 'inventory-groups-role';
  
  if(currentStep === "add-permission" && hasCostPermissions)
    return 'cost-resources';  

  else
    return 'review';
}
