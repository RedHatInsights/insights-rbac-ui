import { fetchGroups } from '../../helpers/group/group-helper';
import asyncDebounce from '../../utilities/async-debounce';
import { useIntl } from 'react-intl';
import messages from '../../Messages';

export const asyncValidator = async (groupName, idKey, id) => {
  const intl = useIntl();
  if (!groupName) {
    return undefined;
  }

  if (groupName.length > 150) {
    throw intl.formatMessage(messages.maxCharactersWarning, { number: 150 });
  }

  const response = await fetchGroups({ limit: 10, offset: 0, filters: { name: groupName }, nameMatch: 'exact' }).catch((error) => {
    console.error(error);
    return undefined;
  });

  if (id ? response?.data?.some((item) => item[idKey] !== id) : response?.data?.length > 0) {
    throw intl.formatMessage(messages.nameAlreadyTaken);
  }

  return undefined;
};

export const debouncedAsyncValidator = asyncDebounce((value, idKey, id) => asyncValidator(value, idKey, id));
