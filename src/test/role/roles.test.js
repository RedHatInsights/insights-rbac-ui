import React from 'react';
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

describe('<Roles />', () => {

  let initialProps;
  const middlewares = [ promiseMiddleware(), notificationsMiddleware() ];
  let mockStore;
  let initialState;

  beforeEach(() => {
    initialProps = {};
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
});
