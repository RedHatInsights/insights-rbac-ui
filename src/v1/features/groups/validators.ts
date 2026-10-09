import { groupsApi } from '../../../shared/data/api/groups';
import { debounce } from '../../../shared/utilities/debounce';
import type { IntlShape } from 'react-intl';
import messages from '../../../Messages';

export const asyncValidator = async (intl: IntlShape, groupName: string, idKey: string, id?: string): Promise<void> => {
  if (!groupName) {
    return undefined;
  }

  if (groupName.length > 150) {
    throw intl.formatMessage(messages.maxCharactersWarning, { number: 150 });
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
    throw intl.formatMessage(messages.nameAlreadyTaken);
  }

  return undefined;
};

export const debouncedAsyncValidator = debounce(
  (intl: IntlShape, value: string, idKey: string, id?: string) => asyncValidator(intl, value, idKey, id),
  250,
  { onlyResolvesLast: false },
);
