import { createContext } from 'react';

export const AddRoleWizardContext = createContext({
  success: false,
  submitting: false,
  error: undefined,
});
