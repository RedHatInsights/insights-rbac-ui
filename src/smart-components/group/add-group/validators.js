import { fetchGroups } from '../../../helpers/group/group-helper';
import asyncDebounce from '../../../utilities/async-debounce';

const asyncValidator = async (groupName) => {
  if (!groupName) {
    return false;
  }

  const response = await fetchGroups({ limit: 10, offset: 0, name: groupName, nameMatch: 'exact' }).catch((error) => {
    console.error(error);
    return;
  });

  return response?.data?.length <= 0;
};

export const debouncedAsyncValidator = asyncDebounce(asyncValidator);
