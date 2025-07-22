import { createContext } from 'react';

export const AddGroupWizardContext = createContext({
  success: false,
  submitting: false,
  error: undefined,
  // eslint-disable-next-line no-unused-vars
  setHideForm: (newValue) => null,
  // eslint-disable-next-line no-unused-vars
  setWizardSuccess: (newValue) => null,
});
