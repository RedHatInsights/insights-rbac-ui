/**
 * Custom validators for the conversion wizard
 */

/**
 * Validates that a checkbox is checked
 * Returns a validator function that checks if the value is true
 */
export const requiredCheckboxValidator = () => (value: boolean) => {
  if (!value) {
    return 'This item must be acknowledged';
  }
  return undefined;
};
