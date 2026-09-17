import { IntlShape } from 'react-intl';
import messages from '../../../Messages';

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
    return intl.formatMessage(messages.conversionWizardCheckboxValidationError);
  }
  return undefined;
};
