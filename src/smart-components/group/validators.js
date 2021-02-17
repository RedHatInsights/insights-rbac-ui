import { fetchGroups } from '../../helpers/group/group-helper';
import asyncDebounce from '../../utilities/async-debounce';

const asyncValidator = async (groupName, idKey, id) => {
  if (!groupName) {
    return undefined;
  }

  if (groupName.length > 150) {
    throw 'Can have maximum of 150 characters.';
  }

  const response = await fetchGroups({ limit: 10, offset: 0, name: groupName, nameMatch: 'exact' }).catch((error) => {
    console.error(error);
    return undefined;
  });

  if (id ? response?.data?.some((item) => item[idKey] !== id) : response?.data?.length > 0) {
    throw 'Name has already been taken.';
  }

  return undefined;
};

export const debouncedAsyncValidator = asyncDebounce((value, idKey, id) => asyncValidator(value, idKey, id));
