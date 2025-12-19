import { useEffect } from 'react';
import { fetchRoles } from '../../../redux/roles/helper';
import { debounceAsync as asyncDebounce } from '../../../utilities/debounce';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { createIntl, createIntlCache } from 'react-intl';
import messages from '../../../Messages';
import providerMessages from '../../../locales/data.json';
import { locale } from '../../../locales/locale';

export const asyncValidator = async (roleName: string): Promise<undefined> => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages[locale as keyof typeof providerMessages] }, cache);
  if (!roleName) {
    return undefined;
  }

  const response = await fetchRoles({ limit: 10, offset: 0, name: roleName, nameMatch: 'exact' }).catch((error: Error) => {
    console.error(error);
    return undefined;
  });

  // it has to be here twice because API is using AND instead of OR
  const responseName = await fetchRoles({
    limit: 10,
    offset: 0,
    displayName: roleName,
    nameMatch: 'exact',
  }).catch((error: Error) => {
    console.error(error);
    return undefined;
  });

  if (
    ((response as { data?: unknown[] })?.data?.length && (response as { data: unknown[] }).data.length > 0) ||
    ((responseName as { data?: unknown[] })?.data?.length && (responseName as { data: unknown[] }).data.length > 0)
  ) {
    throw intl.formatMessage(messages.nameAlreadyTaken);
  }

  return undefined;
};

export const debouncedAsyncValidator = asyncDebounce(asyncValidator);

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
