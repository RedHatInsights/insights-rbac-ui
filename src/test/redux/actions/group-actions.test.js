import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store' ;
import promiseMiddleware from 'redux-promise-middleware';
import { RBAC_API_BASE } from '../../../utilities/constants';
import { fetchGroups } from '../../../redux/actions/group-actions';
import { FETCH_GROUPS } from '../../../redux/action-types';
import { mock } from '../../__mocks__/apiMock';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';

describe('group actions', () => {

  const middlewares = [ thunk, promiseMiddleware(), notificationsMiddleware() ];
  let mockStore;

  beforeEach(() => {
    mockStore = configureStore(middlewares);
  });

  it('should dispatch correct actions after fetching groups', () => {
    const store = mockStore({});
    const expectedActions = [{
      type: `${FETCH_GROUPS}_PENDING`
    }, {
      payload: {
        data: [{
          name: 'groupName',
          uuid: '1234',
          members: undefined
        }]},
      type: `${FETCH_GROUPS}_FULFILLED`
    }];

    mock.onGet(`${RBAC_API_BASE}/groups/`).reply(200, {
      data: [{
        name: 'groupName',
        uuid: '1234'
      }]
    });

    mock.onGet(`${RBAC_API_BASE}/groups/1234/`).reply(200, {
      data: {
        name: 'groupName',
        uuid: '1234'
      }
    });

    return store.dispatch(fetchGroups()).then(() => {
      expect(store.getActions()).toEqual(expectedActions);
    });
  });
});

