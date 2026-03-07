import { createContext } from 'react';

export interface AddGroupWizardContextType {
  success: boolean;
  submitting: boolean;
  submittingGroup: boolean;
  submittingServiceAccounts: boolean;
  error: string | boolean | undefined;
  setHideForm: (newValue: boolean) => void;
  setWizardSuccess: (newValue: boolean) => void;
  setWizardError: (error: boolean | undefined) => void;
}

export const AddGroupWizardContext = createContext<AddGroupWizardContextType>({
  success: false,
  submitting: false,
  submittingGroup: false,
  submittingServiceAccounts: false,
  error: undefined,
  setHideForm: () => null,
  setWizardSuccess: () => null,
  setWizardError: () => null,
});
