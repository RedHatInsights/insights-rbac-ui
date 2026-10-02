import { useEffect } from 'react';
import { debounce } from '../../../../shared/utilities/debounce';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { createIntl, createIntlCache } from 'react-intl';
import { rolesApi } from '../../../data/api/roles';

import providerMessages from '../../../../locales/translations.json';
import { locale } from '../../../../locales/locale';

export const asyncValidator = async (roleName: string): Promise<undefined> => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages }, cache);
  if (!roleName) {
    return undefined;
  }

  const response = await rolesApi.listRoles({ limit: 10, offset: 0, name: roleName, nameMatch: 'exact' }).catch((error: Error) => {
    console.error(error);
    return undefined;
  });

  // it has to be here twice because API is using AND instead of OR
  const responseName = await rolesApi
    .listRoles({
      limit: 10,
      offset: 0,
      displayName: roleName,
      nameMatch: 'exact',
    })
    .catch((error: Error) => {
      console.error(error);
      return undefined;
    });

  if ((response?.data?.data?.length ?? 0) > 0 || (responseName?.data?.data?.length ?? 0) > 0) {
    throw intl.formatMessage({
      id: 'nameAlreadyTaken',
      defaultMessage: 'Name has already been taken.',
      description: 'Name has been already taken validation message',
    });
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
