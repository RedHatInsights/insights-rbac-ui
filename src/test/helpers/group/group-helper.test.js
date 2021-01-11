import { RBAC_API_BASE } from '../../../utilities/constants';
import { mock } from '../../__mocks__/apiMock';
import { fetchGroups, addGroup, removeGroups } from '../../../helpers/group/group-helper';
import { getUserMock } from '../../../../config/setupTests';

describe('group helper', () => {
  it('should call list groups helper', async () => {
    const mockedData = {
      data: [],
      ...getUserMock
    };
    mock.onGet(`${RBAC_API_BASE}/groups/?limit=10&offset=0`).reply(200, mockedData);
    const data = await fetchGroups({ limit: 10, offset: 0 });
    expect(data).toEqual(mockedData);
  });

  it('should call addGroup', async () => {
    const newGroup = { uuid: '123', name: 'group name', user_list: [{ username: 'user1', uuid: '12' }]};
    mock.onPost(`${RBAC_API_BASE}/groups/`).reply(200, newGroup)
    .onPost(`${RBAC_API_BASE}/groups/123/principals/`).reply(200, newGroup);
    const data = await addGroup(newGroup);
    expect(data).toEqual(newGroup);
  });

  it('should call remove group', async () => {
    const uuid = '123';
    mock.onDelete(`${RBAC_API_BASE}/groups/${uuid}/`).reply(200);
    const data = await removeGroups([ uuid ]);
    expect(data[0].status).toBe(200);
  });
});
