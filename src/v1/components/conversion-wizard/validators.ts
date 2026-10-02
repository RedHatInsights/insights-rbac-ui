import { IntlShape } from 'react-intl';

/**
 * Custom validators for the conversion wizard
 */

/**
 * Validates that a checkbox is checked
 * Returns a validator function that checks if the value is true
 * @param intl - The react-intl instance for localization
 */
export const requiredCheckboxValidator = (intl: IntlShape) => () => (value: boolean) => {
  if (!value) {
    return intl.formatMessage({
      id: 'conversionWizardCheckboxValidationError',
      defaultMessage: 'This item must be acknowledged',
      description: 'Error message when required checkbox is not checked',
    });
  }
  return undefined;
};
