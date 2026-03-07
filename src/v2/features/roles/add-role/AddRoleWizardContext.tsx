import { createContext } from 'react';

interface AddRoleWizardContextValue {
  success: boolean;
  submitting: boolean;
  error: boolean | undefined;
  setWizardError?: (error: boolean | undefined) => void;
  setWizardSuccess?: (success: boolean) => void;
  setHideForm?: (hideForm: boolean) => void;
}

export const AddRoleWizardContext = createContext<AddRoleWizardContextValue>({
  success: false,
  submitting: false,
  error: undefined,
});
