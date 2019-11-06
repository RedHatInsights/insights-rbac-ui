import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store' ;
import promiseMiddleware from 'redux-promise-middleware';
import { mock } from '../../__mocks__/apiMock';
import { RBAC_API_BASE } from '../../../utilities/constants';
import { fetchRoles } from '../../../redux/actions/role-actions';
import { FETCH_ROLES } from '../../../redux/action-types';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';

describe('role actions', () => {

  const middlewares = [ thunk, promiseMiddleware(), notificationsMiddleware() ];
  let mockStore;

  beforeEach(() => {
    mockStore = configureStore(middlewares);
  });

  it('should dispatch correct actions after fetching roles', () => {
    const store = mockStore({});
    const expectedActions = [{
      type: `${FETCH_ROLES}_PENDING`
    }, {
      payload: {
        data: [
          {
            name: 'roleName',
            uuid: '1234'
          }
        ]
      },
      type: `${FETCH_ROLES}_FULFILLED`
    }];

    mock.onGet(`${RBAC_API_BASE}/roles/`).reply(200, {
      data: [{
        name: 'roleName',
        uuid: '1234'
      }]
    });

    mock.onGet(`${RBAC_API_BASE}/roles/1234/`).reply(200, {
      data: [{
        name: 'roleName',
        uuid: '1234'
      }]
    });

    return store.dispatch(fetchRoles()).then(() => {
      expect(store.getActions()).toEqual(expectedActions);
    });
  });
});

