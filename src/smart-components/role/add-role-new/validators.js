import { fetchRoles } from '../../../helpers/role/role-helper';
import asyncDebounce from '../../../utilities/async-debounce';

const asyncValidator = async (groupName) => {
    if (!groupName) {
        return undefined;
    }

    const response = await fetchRoles({ limit: 10, offset: 0, name: groupName, nameMatch: 'exact' })
    .catch(error => {
        console.error(error);
        return undefined;
    });

    if (response?.data?.length > 0) {
        throw 'Name has already been taken';
    }

    return undefined;
};

export const debouncedAsyncValidator = asyncDebounce(asyncValidator);
