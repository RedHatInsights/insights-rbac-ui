import { createContext } from 'react';

interface AddRoleWizardContextType {
  success: boolean;
  submitting: boolean;
  error: unknown | undefined;
  hideForm: boolean;
  setWizardError: (error: unknown) => void;
  setWizardSuccess: (success: boolean) => void;
  setHideForm: (hideForm: boolean) => void;
}

export const AddRoleWizardContext = createContext<AddRoleWizardContextType>({
  success: false,
  submitting: false,
  error: undefined,
  hideForm: false,
  setWizardError: () => {},
  setWizardSuccess: () => {},
  setHideForm: () => {},
});
