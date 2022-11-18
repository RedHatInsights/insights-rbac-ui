import React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { MemoryRouter, Route } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import toJson from 'enzyme-to-json';
import promiseMiddleware from 'redux-promise-middleware';
import GroupPrincipals from '../../../../smart-components/group/principal/principals';
import notificationsMiddleware from '@redhat-cloud-services/frontend-components-notifications/notificationsMiddleware';
import * as GroupActions from '../../../../redux/actions/group-actions';
import { FETCH_GROUPS, FETCH_MEMBERS_FOR_GROUP } from '../../../../redux/action-types';

jest.mock('../../../../redux/actions/group-actions', () => {
  const actual = jest.requireActual('../../../../redux/actions/group-actions');
  return {
    __esModule: true,
    ...actual,
  };
});

describe('<GroupPrincipals />', () => {
  const middlewares = [promiseMiddleware, notificationsMiddleware()];
  let mockStore;
  let initialState;

  const fetchMembersForGroupSpy = jest.spyOn(GroupActions, 'fetchMembersForGroup');
  // removeMembersFromGroup,
  const fetchGroupsSpy = jest.spyOn(GroupActions, 'fetchGroups');

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
    fetchGroupsSpy.mockReset();
  });

  it('should render correctly loader', async () => {
    fetchMembersForGroupSpy.mockImplementationOnce(() => ({ type: FETCH_MEMBERS_FOR_GROUP, payload: Promise.resolve({}) }));
    fetchMembersForGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUPS, payload: Promise.resolve({}) }));
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
    let wrapper;
    await act(async () => {
      wrapper = shallow(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/groups/detail/test-group/members']}>
            <Route path="/groups/detail/:uuid/members" component={GroupPrincipals} />
          </MemoryRouter>
        </Provider>
      );
    });
    expect(toJson(wrapper.find('ListLoader'), { mode: 'shallow' })).toMatchSnapshot();
  });

  it('should render correctly with empty members', async () => {
    fetchMembersForGroupSpy.mockImplementationOnce(() => ({ type: FETCH_MEMBERS_FOR_GROUP, payload: Promise.resolve({}) }));
    fetchMembersForGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUPS, payload: Promise.resolve({}) }));
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
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/groups/detail/test-group/members']}>
            <Route path="/groups/detail/:uuid/members" component={GroupPrincipals} />
          </MemoryRouter>
        </Provider>
      );
    });
    expect(toJson(wrapper.find('EmptyWithAction'), { mode: 'shallow' })).toMatchSnapshot();
  });

  it('should render correctly with org admin rights', async () => {
    fetchMembersForGroupSpy.mockImplementationOnce(() => ({ type: FETCH_MEMBERS_FOR_GROUP, payload: Promise.resolve({}) }));
    fetchMembersForGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUPS, payload: Promise.resolve({}) }));
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
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/groups/detail/test-group/members']}>
            <Route path="/groups/detail/:uuid/members" component={GroupPrincipals} />
          </MemoryRouter>
        </Provider>
      );
    });
    expect(toJson(wrapper.find('TableToolbarViewOld'), { mode: 'shallow' })).toMatchSnapshot();
  });

  it('should render correctly with default group', async () => {
    fetchMembersForGroupSpy.mockImplementationOnce(() => ({ type: FETCH_MEMBERS_FOR_GROUP, payload: Promise.resolve({}) }));
    fetchMembersForGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUPS, payload: Promise.resolve({}) }));
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
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/groups/detail/test-group/members']}>
            <Route path="/groups/detail/:uuid/members" component={GroupPrincipals} />
          </MemoryRouter>
        </Provider>
      );
    });
    expect(toJson(wrapper.find('#tab-principals'))).toMatchSnapshot();
  });

  it('should render correctly with data', async () => {
    fetchMembersForGroupSpy.mockImplementationOnce(() => ({ type: FETCH_MEMBERS_FOR_GROUP, payload: Promise.resolve({}) }));
    fetchMembersForGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUPS, payload: Promise.resolve({}) }));
    const store = mockStore(initialState);
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/groups/detail/test-group/members']}>
            <Route path="/groups/detail/:uuid/members" component={GroupPrincipals} />
          </MemoryRouter>
        </Provider>
      );
    });
    expect(toJson(wrapper.find('TableToolbarViewOld'), { mode: 'shallow' })).toMatchSnapshot();
  });
});
