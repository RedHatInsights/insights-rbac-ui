import React from 'react';
import { act } from 'react-dom/test-utils';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { shallow, mount } from 'enzyme';
import configureStore from 'redux-mock-store';
import { shallowToJson } from 'enzyme-to-json';

import { MemoryRouter } from 'react-router-dom';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';
import AddGroupMembers from '../../../../smart-components/group/principal/add-group-members';

import * as UserHelper from '../../../../helpers/user/user-helper';

describe('<AddGroupMembers />', () => {
  let initialState;
  let responseBody;
  const middlewares = [thunk, promiseMiddleware, notificationsMiddleware()];
  let mockStore;
  const fetchUsersSpy = jest.spyOn(UserHelper, 'fetchUsers');

  beforeEach(() => {
    initialState = {
      groupReducer: {
        groups: {
          data: [
            {
              uuid: '123',
              name: 'SampleGroup',
            },
          ],
        },
      },
      userReducer: {
        selectedUser: {},
        isUserDataLoading: false,
        users: {
          data: [],
          meta: {
            count: 0,
          },
        },
      },
    };
    responseBody = {
      data: [
        {
          username: 'test_name',
          email: 'testmail@redhat.com',
          first_name: 'test',
          last_name: 'test',
          is_active: true,
        },
      ],
      meta: {
        count: 1,
        limit: 10,
        offset: undefined,
      },
    };
    mockStore = configureStore(middlewares);
  });

  afterEach(() => {
    fetchUsersSpy.mockReset();
  });

  it('should render correctly', () => {
    const store = mockStore(initialState);
    const wrapper = shallow(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/groups/detail/test-group/members/add_members']}>
          <AddGroupMembers></AddGroupMembers>
        </MemoryRouter>
      </Provider>
    );
    expect(shallowToJson(wrapper)).toMatchSnapshot();
  });

  it('should fetchUsers on load correctly', async () => {
    const store = mockStore(initialState);
    fetchUsersSpy.mockImplementationOnce(() => Promise.resolve(responseBody));
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/groups/detail/test-group/members/add_members']}>
            <AddGroupMembers></AddGroupMembers>
          </MemoryRouter>
        </Provider>
      );
    });
    const expectedPayload = [
      expect.objectContaining({ type: 'FETCH_USERS_PENDING' }),
      expect.objectContaining({
        type: 'FETCH_USERS_FULFILLED',
        payload: responseBody,
      }),
    ];
    expect(store.getActions()).toEqual(expectedPayload);
    expect(wrapper.find(AddGroupMembers)).toHaveLength(1);
    expect(fetchUsersSpy).toHaveBeenCalledWith({
      limit: 20,
      status: ['Active'],
    });
  });

  it('should show a notification on cancel', async () => {
    const store = mockStore(initialState);
    fetchUsersSpy.mockImplementationOnce(() => Promise.resolve(responseBody));
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/groups/detail/test-group/members/add_members']}>
            <AddGroupMembers></AddGroupMembers>
          </MemoryRouter>
        </Provider>
      );
    });
    wrapper.update();
    const expectedPayload = [
      expect.objectContaining({ type: 'FETCH_USERS_PENDING' }),
      expect.objectContaining({
        type: 'FETCH_USERS_FULFILLED',
        payload: responseBody,
      }),
      expect.objectContaining({ type: '@@INSIGHTS-CORE/NOTIFICATIONS/ADD_NOTIFICATION' }),
    ];
    wrapper.find('button#add-groups-cancel').simulate('click');
    wrapper.update();
    expect(store.getActions()).toEqual(expectedPayload);
    expect(fetchUsersSpy).toHaveBeenCalledWith({
      limit: 20,
      status: ['Active'],
    });
  });
});
