import React from 'react';
import { act } from 'react-dom/test-utils';
import { mount } from 'enzyme';
import configureStore from 'redux-mock-store';
import { MemoryRouter, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import toJson from 'enzyme-to-json';
import promiseMiddleware from 'redux-promise-middleware';
import Roles from '../../smart-components/role/roles';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications';
import { rolesInitialState } from '../../redux/reducers/role-reducer';
import { mock } from '../__mocks__/apiMock';
import { RBAC_API_BASE } from '../../utilities/constants';
import { getUserMock } from '../../../config/setupTests';

describe('<Roles />', () => {
  const middlewares = [ promiseMiddleware, notificationsMiddleware() ];
  let mockStore;
  let initialState;

  beforeEach(() => {
    mockStore = configureStore(middlewares);
    initialState = { roleReducer: {
      ...rolesInitialState,
      roles: {
        identity: {
          user: {}
        },
        data: [{
          name: 'Test name',
          uuid: 'test',
          description: 'test',
          system: 'test',
          accessCount: 'test',
          groups_in_count: 5,
          modified: new Date(0)
        }]
      },
      isLoading: false
    }};
    mock.onGet(`${RBAC_API_BASE}/roles/`).replyOnce(200);
  });

  it('should render correctly', () => {
    const store = mockStore(initialState);
    mock.onGet(`/api/rbac/v1/roles/?name=&scope=account&add_fields=groups_in_count`).reply(200, {});
    const wrapper = mount(<Provider store={ store }>
      <MemoryRouter initialEntries={ [ '/roles' ] }>
        <Route path="/roles" component={ Roles } />
      </MemoryRouter>
    </Provider>);
    expect(toJson(wrapper.find('TableToolbarView'), { mode: 'shallow' })).toMatchSnapshot();
  });

  it('should render correctly in loading state', () => {
    const store = mockStore({
      ...initialState,
      roleReducer: {
        ...initialState.roleReducer,
        isLoading: true
      }
    });
    const wrapper = mount(<Provider store={ store }>
      <MemoryRouter initialEntries={ [ '/roles' ] }>
        <Route path="/roles" component={ Roles } />
      </MemoryRouter>
    </Provider>);
    expect(toJson(wrapper.find('ListLoader'), { mode: 'shallow' })).toMatchSnapshot();
  });

  it('should render correctly in org admin', () => {
    const store = mockStore({
      ...initialState,
      roleReducer: {
        ...initialState.roleReducer,
        roles: {
          ...initialState.roleReducer.roles,
          identity: {
            user: { is_org_admin: true }
          }
        }
      }
    });
    const wrapper = mount(<Provider store={ store }>
      <MemoryRouter initialEntries={ [ '/roles' ] }>
        <Route path="/roles" component={ Roles } />
      </MemoryRouter>
    </Provider>);
    expect(toJson(wrapper.find('TableToolbarView'), { mode: 'shallow' })).toMatchSnapshot();
  });

  it('should fetch roles on sort click', async() => {
    const store = mockStore(initialState);
    mock.onGet(`/api/rbac/v1/roles/?name=&scope=account&add_fields=groups_in_count`).reply(200, {});
    mock.onGet(`/api/rbac/v1/roles/?limit=20&scope=account&order_by=name&add_fields=groups_in_count`).replyOnce(200, {});
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider store={ store }>
          <MemoryRouter initialEntries={ [ '/roles' ] }>
            <Route path="/roles" component={ Roles } />
          </MemoryRouter>
        </Provider>
      );
    });
    store.clearActions();
    await act(async () => {
      wrapper.find('span.pf-c-table__sort-indicator').first().simulate('click');
    });
    const expectedPayloadAfter = [
      { type: 'FETCH_ROLES_PENDING' },
      { type: 'FETCH_ROLES_FULFILLED', payload: {
        ...getUserMock
      }}
    ];
    expect(store.getActions()).toEqual(expectedPayloadAfter);
  });
});
