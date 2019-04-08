import { getGroupApi } from '../../../Helpers/Shared/userLogin';
import { RBAC_API_BASE } from '../../../Utilities/Constants';

describe('user login', () => {
  it('should set correct basePath for the group api instance', () => {
    const groupApi = getGroupApi();
    expect(groupApi.basePath).toEqual(RBAC_API_BASE);
  });
});
