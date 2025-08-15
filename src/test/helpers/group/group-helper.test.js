import * as GroupsHelper from '../../../helpers/group/group-helper';

import { getUserMock } from '../../../../config/setupTests';
import * as UserLogin from '../../../helpers/shared/user-login';

/**
 * These tests seem to me a bit strange, we are basically checking that promise returns a value.
 * I think we can discard helper tests entirely.
 * I will migrate this one to the jest mock style just for reference. Martin.
 */

jest.mock('@redhat-cloud-services/frontend-components-utilities/interceptors', () => ({
  __esModule: true, // mark it as es module
  default: { get: jest.fn(), request: jest.fn(), post: jest.fn() },
}));

describe('group helper', () => {
  const mockedData = {
    ...getUserMock,
  };
  const pagination = { limit: 10, offset: 0, redirected: false };

  const groupApi = UserLogin.getGroupApi();
  const addMemberToGroupSpy = jest.spyOn(groupApi, 'addPrincipalToGroup');
  const addRoleToGroupSpy = jest.spyOn(groupApi, 'addRoleToGroup');
  const deleteGroupSpy = jest.spyOn(groupApi, 'deleteGroup');

  afterEach(() => {
    addMemberToGroupSpy.mockReset();
    addRoleToGroupSpy.mockReset();
    deleteGroupSpy.mockReset();
  });

  it('should call list groups helper in Modal', async () => {
    const listGroupsGroupSpy = jest.spyOn(groupApi, 'listGroups');
    listGroupsGroupSpy.mockResolvedValueOnce(mockedData);
    const data = await GroupsHelper.fetchGroups(pagination);
    expect(data).toEqual(mockedData);
  });

  it('should call list groups helper in Table', async () => {
    const listGroupsGroupSpy = jest.spyOn(groupApi, 'listGroups');
    listGroupsGroupSpy.mockResolvedValueOnce(mockedData);
    const data = await GroupsHelper.fetchGroups({ ...pagination, usesMetaInURL: true });
    expect(data).toEqual({ ...mockedData, filters: {}, pagination });
  });

  it('should call addGroup, addMemberToGroup and addRoleToGroup', async () => {
    expect.assertions(2);
    const newGroup = {
      uuid: '123',
      name: 'group name',
      user_list: [{ username: 'user1', uuid: '12' }],
      roles_list: ['role-1', 'role-2'],
    };
    const newPrincipalsResponse = { principals: newGroup.user_list };

    const createGroupSpy = jest.spyOn(groupApi, 'createGroup');

    createGroupSpy.mockResolvedValueOnce(newGroup);
    addMemberToGroupSpy.mockResolvedValueOnce('group-with-principals');
    addRoleToGroupSpy.mockResolvedValueOnce('group-with-roles');
    await GroupsHelper.addGroup(newGroup);

    expect(addMemberToGroupSpy).toHaveBeenCalledWith('123', newPrincipalsResponse);
    expect(addRoleToGroupSpy).toHaveBeenCalledWith('123', { roles: ['role-1', 'role-2'] });
  });

  it('should call remove group', async () => {
    deleteGroupSpy.mockResolvedValueOnce().mockResolvedValueOnce();
    await GroupsHelper.removeGroups(['123', '456']);
    expect(deleteGroupSpy).toHaveBeenCalledTimes(2);
  });
});
