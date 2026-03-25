import { useEffect } from 'react';
import { debounce } from '../../../../shared/utilities/debounce';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { createIntl, createIntlCache } from 'react-intl';
import { rolesV2Api } from '../../../data/api/roles';
import messages from '../../../../Messages';
import providerMessages from '../../../../locales/data.json';
import { locale } from '../../../../locales/locale';

export const asyncValidator = async (roleName: string): Promise<undefined> => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages[locale as keyof typeof providerMessages] }, cache);
  if (!roleName) {
    return undefined;
  }

  const response = await rolesV2Api.rolesList({ name: roleName }).catch((error: Error) => {
    console.error(error);
    return undefined;
  });

  if ((response?.data?.data?.length ?? 0) > 0) {
    throw intl.formatMessage(messages.nameAlreadyTaken);
  }

  return undefined;
};

export const debouncedAsyncValidator = debounce(asyncValidator, 250, { onlyResolvesLast: false });

interface ValidatorResetProps {
  name: string;
}

export const ValidatorReset: React.FC<ValidatorResetProps> = ({ name }) => {
  const formOptions = useFormApi();

  useEffect(() => {
    setTimeout(() => formOptions.change(name, '1'));

    return () => formOptions.change(name, '');
  }, []);

  return null;
};
