import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import toJson from 'enzyme-to-json';
import { mock } from '../../../__mocks__/apiMock';
import promiseMiddleware from 'redux-promise-middleware';
import GroupPrincipals from '../../../../smart-components/group/principal/principals';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications';
import { RBAC_API_BASE } from '../../../../utilities/constants';

describe('<GroupPrincipals />', () => {

  const middlewares = [ promiseMiddleware, notificationsMiddleware() ];
  let mockStore;
  let initialState;

  beforeEach(() => {
    mockStore = configureStore(middlewares);
    initialState = { groupReducer: { groups: {}, selectedGroup: { members: {
      isLoading: false,
      meta: { count: 2, offset: 0, limit: 10 },
      data: [
        { username: 'test', email: 'test', first_name: 'test', last_name: 'test', is_active: true },
        { username: 'test2', email: 'test2', first_name: 'test2', last_name: 'test2', is_active: false }]
    }}}};
    mock.onGet(`${RBAC_API_BASE}/groups/test-group/principals/`).replyOnce(200);
  });

  it('should render correctly loader', () => {
    const store = mockStore({
      ...initialState,
      groupReducer: {
        ...initialState.groupReducer,
        selectedGroup: {
          members: {
            isLoading: true
          }
        }
      }
    });
    const wrapper = mount(<Provider store={ store }>
      <MemoryRouter initialEntries={ [ '/groups/detail/test-group/members' ] }>
        <Route path="/groups/detail/:uuid/members" component={ GroupPrincipals } />
      </MemoryRouter>
    </Provider>);
    expect(toJson(wrapper.find('ListLoader'), { mode: 'shallow' })).toMatchSnapshot();
  });

  it('should render correctly with empty members', () => {
    const store = mockStore({
      ...initialState,
      groupReducer: {
        ...initialState.groupReducer,
        selectedGroup: {
          members: {
            isLoading: false,
            data: [],
            meta: {}
          }
        }
      }
    });
    const wrapper = mount(<Provider store={ store }>
      <MemoryRouter initialEntries={ [ '/groups/detail/test-group/members' ] }>
        <Route path="/groups/detail/:uuid/members" component={ GroupPrincipals } />
      </MemoryRouter>
    </Provider>);
    expect(toJson(wrapper.find('EmptyWithFilter'), { mode: 'shallow' })).toMatchSnapshot();
  });

  it('should render correctly with org admin rights', () => {
    const store = mockStore({
      groupReducer: {
        ...initialState.groupReducer,
        groups: {
          entitlements: {
            user: {
              is_org_admin: true
            }
          }
        }
      }
    });
    const wrapper = mount(<Provider store={ store }>
      <MemoryRouter initialEntries={ [ '/groups/detail/test-group/members' ] }>
        <Route path="/groups/detail/:uuid/members" component={ GroupPrincipals } />
      </MemoryRouter>
    </Provider>);
    expect(toJson(wrapper.find('TableToolbarView'), { mode: 'shallow' })).toMatchSnapshot();
  });

  it('should render correctly with default group', () => {
    const store = mockStore({
      groupReducer: {
        ...initialState.groupReducer,
        selectedGroup: {
          ...initialState.groupReducer.selectedGroup,
          platform_default: true,
          loaded: true
        }
      }
    });
    const wrapper = mount(<Provider store={ store }>
      <MemoryRouter initialEntries={ [ '/groups/detail/test-group/members' ] }>
        <Route path="/groups/detail/:uuid/members" component={ GroupPrincipals } />
      </MemoryRouter>
    </Provider>);
    expect(toJson(wrapper.find('#tab-principals'))).toMatchSnapshot();
  });

  it('should render correctly with data', () => {
    const store = mockStore(initialState);
    const wrapper = mount(<Provider store={ store }>
      <MemoryRouter initialEntries={ [ '/groups/detail/test-group/members' ] }>
        <Route path="/groups/detail/:uuid/members" component={ GroupPrincipals } />
      </MemoryRouter>
    </Provider>);
    expect(toJson(wrapper.find('TableToolbarView'), { mode: 'shallow' })).toMatchSnapshot();
  });
});
