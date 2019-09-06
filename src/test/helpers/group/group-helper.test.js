import { RBAC_API_BASE } from '../../../utilities/constants';
import { fetchGroups, addGroup, removeGroup } from '../../../helpers/group/group-helper';

describe('group helper', () => {
  it('should call list groups helper', done => {
    expect.assertions(1);
    apiClientMock.get(`${RBAC_API_BASE}/groups/?limit=10&offset=0`, mockOnce((req, res) => {
      expect(req).toBeTruthy();
      done();
      return res.status(200);
    }));
    fetchGroups({ limit: 10, offset: 0 });
  });

  it('should call addGroup', done => {
    expect.assertions(1);
    apiClientMock.post(`${RBAC_API_BASE}/groups/`, mockOnce((req, res) => {
      expect(req).toBeTruthy();
      done();
      return res.status(200);
    }));
    addGroup({ uuid: '123', name: 'group name', user_list: [{ username: 'user1', uuid: '12' }]});
  });

  it('should call remove group', done => {
    expect.assertions(1);
    apiClientMock.delete(`${RBAC_API_BASE}/groups/123/`, mockOnce((req, res) => {
      expect(req).toBeTruthy();
      done();
      return res.status(200);
    }));
    removeGroup('123');
  });
});
