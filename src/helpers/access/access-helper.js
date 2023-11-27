import { getAccessApi } from '../shared/user-login';

const accessApi = getAccessApi();

export async function getPrincipalAccess({ limit, offset, username, application = '', status, orderBy }) {
  return await accessApi.getPrincipalAccess(application, username, orderBy, status, limit, offset);
}
