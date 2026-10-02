import { groupsApi } from '../../../shared/data/api/groups';
import { debounce } from '../../../shared/utilities/debounce';
import { createIntl, createIntlCache } from 'react-intl';

import providerMessages from '../../../locales/translations.json';
import { locale } from '../../../locales/locale';
import { commonMessages } from '../../../shared/messages/common';

export const asyncValidator = async (groupName: string, idKey: string, id?: string): Promise<void> => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages as unknown as Record<string, string> }, cache);

  if (!groupName) {
    return undefined;
  }

  if (groupName.length > 150) {
    throw intl.formatMessage(commonMessages.maxCharactersWarning, { number: 150 });
  }

  const response = await groupsApi
    .listGroups({
      limit: 10,
      offset: 0,
      name: groupName,
      nameMatch: 'exact',
    })
    .catch((error: unknown) => {
      console.error(error);
      return undefined;
    });

  const groups = response?.data?.data ?? [];

  if (id ? groups.some((item) => item[idKey as keyof typeof item] !== id) : groups.length > 0) {
    throw intl.formatMessage({
      id: 'nameAlreadyTaken',
      defaultMessage: 'Name has already been taken.',
      description: 'Name has been already taken validation message',
    });
  }

  return undefined;
};

export const debouncedAsyncValidator = debounce((value: string, idKey: string, id?: string) => asyncValidator(value, idKey, id), 250, {
  onlyResolvesLast: false,
});
