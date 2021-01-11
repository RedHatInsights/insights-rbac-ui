import { getAccessApi } from '../shared/user-login';

const accessApi = getAccessApi();

export async function getPrincipalAccess() {
    return await accessApi.getPrincipalAccess('');
}
