import { getPrincipalApi } from '../shared/user-login';

const principalApi = getPrincipalApi();

export function fetchUsers() {
  return principalApi.listPrincipals();
}
