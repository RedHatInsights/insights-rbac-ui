import { getGroupApi } from '../../../helpers/shared/user-login';
import { RBAC_API_BASE } from '../../../utilities/constants';

describe('user login', () => {
  it('should set correct basePath for the group api instance', () => {
    const groupApi = getGroupApi();
    expect(groupApi.basePath).toEqual(RBAC_API_BASE);
  });
});
