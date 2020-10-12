import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import toJson from 'enzyme-to-json';
import promiseMiddleware from 'redux-promise-middleware';
import GroupPrincipals from '../../../../smart-components/group/principal/principals';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications';
import * as GroupActions from '../../../../redux/actions/group-actions';
import { FETCH_MEMBERS_FOR_GROUP } from '../../../../redux/action-types';

describe('<GroupPrincipals />', () => {
  const middlewares = [promiseMiddleware, notificationsMiddleware()];
  let mockStore;
  let initialState;

  const fetchMembersForGroupSpy = jest.spyOn(GroupActions, 'fetchMembersForGroup');

  beforeEach(() => {
    mockStore = configureStore(middlewares);
    initialState = {
      groupReducer: {
        groups: {},
        selectedGroup: {
          members: {
            isLoading: false,
            meta: { count: 2, offset: 0, limit: 10 },
            data: [
              { username: 'test', email: 'test', first_name: 'test', last_name: 'test', is_active: true },
              { username: 'test2', email: 'test2', first_name: 'test2', last_name: 'test2', is_active: false },
            ],
          },
        },
      },
    };
  });

  afterEach(() => {
    fetchMembersForGroupSpy.mockReset();
  });

  it('should render correctly loader', () => {
    fetchMembersForGroupSpy.mockImplementationOnce(() => ({ type: FETCH_MEMBERS_FOR_GROUP, payload: Promise.resolve({}) }));
    const store = mockStore({
      ...initialState,
      groupReducer: {
        ...initialState.groupReducer,
        selectedGroup: {
          members: {
            isLoading: true,
          },
        },
      },
    });
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/groups/detail/test-group/members']}>
          <Route path="/groups/detail/:uuid/members" component={GroupPrincipals} />
        </MemoryRouter>
      </Provider>
    );
    expect(toJson(wrapper.find('ListLoader'), { mode: 'shallow' })).toMatchSnapshot();
  });

  it('should render correctly with empty members', () => {
    fetchMembersForGroupSpy.mockImplementationOnce(() => ({ type: FETCH_MEMBERS_FOR_GROUP, payload: Promise.resolve({}) }));
    const store = mockStore({
      ...initialState,
      groupReducer: {
        ...initialState.groupReducer,
        selectedGroup: {
          members: {
            isLoading: false,
            data: [],
            meta: {},
          },
        },
      },
    });
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/groups/detail/test-group/members']}>
          <Route path="/groups/detail/:uuid/members" component={GroupPrincipals} />
        </MemoryRouter>
      </Provider>
    );
    expect(toJson(wrapper.find('EmptyWithFilter'), { mode: 'shallow' })).toMatchSnapshot();
  });

  it('should render correctly with org admin rights', () => {
    fetchMembersForGroupSpy.mockImplementationOnce(() => ({ type: FETCH_MEMBERS_FOR_GROUP, payload: Promise.resolve({}) }));
    const store = mockStore({
      groupReducer: {
        ...initialState.groupReducer,
        groups: {
          entitlements: {
            user: {
              is_org_admin: true,
            },
          },
        },
      },
    });
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/groups/detail/test-group/members']}>
          <Route path="/groups/detail/:uuid/members" component={GroupPrincipals} />
        </MemoryRouter>
      </Provider>
    );
    expect(toJson(wrapper.find('TableToolbarView'), { mode: 'shallow' })).toMatchSnapshot();
  });

  it('should render correctly with default group', () => {
    fetchMembersForGroupSpy.mockImplementationOnce(() => ({ type: FETCH_MEMBERS_FOR_GROUP, payload: Promise.resolve({}) }));
    const store = mockStore({
      groupReducer: {
        ...initialState.groupReducer,
        selectedGroup: {
          ...initialState.groupReducer.selectedGroup,
          platform_default: true,
          loaded: true,
        },
      },
    });
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/groups/detail/test-group/members']}>
          <Route path="/groups/detail/:uuid/members" component={GroupPrincipals} />
        </MemoryRouter>
      </Provider>
    );
    expect(toJson(wrapper.find('#tab-principals'))).toMatchSnapshot();
  });

  it('should render correctly with data', () => {
    fetchMembersForGroupSpy.mockImplementationOnce(() => ({ type: FETCH_MEMBERS_FOR_GROUP, payload: Promise.resolve({}) }));
    const store = mockStore(initialState);
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/groups/detail/test-group/members']}>
          <Route path="/groups/detail/:uuid/members" component={GroupPrincipals} />
        </MemoryRouter>
      </Provider>
    );
    expect(toJson(wrapper.find('TableToolbarView'), { mode: 'shallow' })).toMatchSnapshot();
  });
});
