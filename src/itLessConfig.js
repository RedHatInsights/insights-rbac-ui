/* eslint-disable rulesdir/no-chrome-api-call-from-window */
// Safe getter for environment that handles missing window.insights
// Note: This file is used at module initialization time before React context is available
const getEnvironment = () => {
  try {
    return (typeof window !== 'undefined' && window.insights?.chrome?.getEnvironment?.()) || '';
  } catch {
    return '';
  }
};

export const isEphem = getEnvironment() === 'ephem';
export const isInt = getEnvironment() === 'int';
export const isStage = getEnvironment() === 'frhStage';
export const isITLessProd = getEnvironment() === 'frh';
