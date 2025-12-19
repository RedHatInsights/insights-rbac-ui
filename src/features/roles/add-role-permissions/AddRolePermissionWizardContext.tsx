import { createContext } from 'react';

interface AddRolePermissionWizardContextValue {
  success: boolean;
  submitting: boolean;
  error: string | undefined;
  setWizardError?: (error: string | undefined) => void;
  setWizardSuccess?: (success: boolean) => void;
  setHideForm?: (hideForm: boolean) => void;
  rolePermissions?: { permission: string }[];
}

export const AddRolePermissionWizardContext = createContext<AddRolePermissionWizardContextValue>({
  success: false,
  submitting: false,
  error: undefined,
});
