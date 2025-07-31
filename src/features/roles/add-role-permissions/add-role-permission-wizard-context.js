import { createContext } from 'react';

export const AddRolePermissionWizardContext = createContext({
  success: false,
  submitting: false,
  error: undefined,
});
