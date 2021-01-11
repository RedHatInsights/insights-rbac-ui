import React from 'react';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { shallow, mount } from 'enzyme';
import configureStore from 'redux-mock-store' ;
import { shallowToJson } from 'enzyme-to-json';

import { MemoryRouter } from 'react-router-dom';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';
import { RBAC_API_BASE } from '../../../../utilities/constants';
import AddGroupMembers from '../../../../smart-components/group/principal/add-group-members';

describe('<AddGroupMembers />', () => {
  let initialState;
  let responseBody;
  const middlewares = [ thunk, promiseMiddleware, notificationsMiddleware() ];
  let mockStore;

  beforeEach(() => {
    initialState = {
      groupReducer: {
        groups: { data: [{
          uuid: '123',
          name: 'SampleGroup'
        }]}
      },
      userReducer: {
        selectedUser: {},
        isUserDataLoading: false,
        users: {
          data: [],
          meta: {
            count: 0
          }
        }
      }
    };
    responseBody = {
      data: [
        {
          username: 'test_name',
          email: 'testmail@redhat.com',
          first_name: 'test',
          last_name: 'test',
          is_active: true
        }
      ],
      meta: {
        count: 1,
        limit: 10,
        offset: undefined
      }
    };
    mockStore = configureStore(middlewares);
  });

  it('should render correctly', () => {
    const store = mockStore(initialState);
    const wrapper = shallow(
      <Provider store={ store }>
        <MemoryRouter initialEntries={ [ '/groups/detail/test-group/members/add_members' ] }>
          <AddGroupMembers></AddGroupMembers>
        </MemoryRouter>
      </Provider>
    );
    expect(shallowToJson(wrapper)).toMatchSnapshot();
  });

  it('should fetchUsers on load correctly', (done) => {
    const store = mockStore(initialState);
    apiClientMock.get(`${RBAC_API_BASE}/principals/?limit=10&sort_order=asc`, mockOnce({ body: responseBody }));
    const wrapper = mount(
      <Provider store={ store }>
        <MemoryRouter initialEntries={ [ '/groups/detail/test-group/members/add_members' ] }>
          <AddGroupMembers></AddGroupMembers>
        </MemoryRouter>
      </Provider>
    );
    const expectedPayload = [
      expect.objectContaining({ type: 'FETCH_USERS_PENDING' }),
      expect.objectContaining({
        type: 'FETCH_USERS_FULFILLED',
        payload: responseBody
      })
    ];
    setImmediate(() => {
      expect(store.getActions()).toEqual(expectedPayload);
      expect(wrapper.find(AddGroupMembers)).toHaveLength(1);
      done();
    });
  });

  it('should show a notification on cancel', (done) => {
    const store = mockStore(initialState);
    apiClientMock.get(`${RBAC_API_BASE}/principals/?limit=10&sort_order=asc`, mockOnce({ body: responseBody }));
    const wrapper = mount(
      <Provider store={ store }>
        <MemoryRouter initialEntries={ [ '/groups/detail/test-group/members/add_members' ] }>
          <AddGroupMembers></AddGroupMembers>
        </MemoryRouter>
      </Provider>
    );
    const expectedPayload = [
      expect.objectContaining({ type: 'FETCH_USERS_PENDING' }),
      expect.objectContaining({ type: '@@INSIGHTS-CORE/NOTIFICATIONS/ADD_NOTIFICATION' }),
      expect.objectContaining({
        type: 'FETCH_USERS_FULFILLED',
        payload: responseBody
      })
    ];
    wrapper.find('.pf-m-link').simulate('click');
    wrapper.update();
    setImmediate(() => {
      expect(store.getActions()).toEqual(expectedPayload);
      done();
    });
  });
});
