import { getAccessApi } from '../shared/user-login';

const accessApi = getAccessApi();

export async function getPrincipalAccess({ limit, offset, username, application = '' }) {
  return await accessApi.getPrincipalAccess(application, username, limit, offset);
}
