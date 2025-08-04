import { createContext } from 'react';

export interface AddGroupWizardContextType {
  success: boolean;
  submitting: boolean;
  error: string | undefined;
  setHideForm: (newValue: boolean) => void;
  setWizardSuccess: (newValue: boolean) => void;
}

export const AddGroupWizardContext = createContext<AddGroupWizardContextType>({
  success: false,
  submitting: false,
  error: undefined,
  setHideForm: () => null,
  setWizardSuccess: () => null,
});
