import React from 'react';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';
import configureStore from 'redux-mock-store' ;
import { MemoryRouter, Route } from 'react-router-dom';
import promiseMiddleware from 'redux-promise-middleware';
import { mock } from '../__mocks__/apiMock';
import { notificationsMiddleware, ADD_NOTIFICATION } from '@redhat-cloud-services/frontend-components-notifications/';
import { RBAC_API_BASE } from '../../utilities/constants';
import RemoveRoleModal from '../../smart-components/role/remove-role-modal';
import { rolesInitialState } from '../../redux/reducers/role-reducer';
import { REMOVE_ROLE, FETCH_ROLE, FETCH_ROLES } from '../../redux/action-types';

describe('<RemoveRoleModal />', () => {
  let initialProps;
  const middlewares = [ thunk, promiseMiddleware(), notificationsMiddleware() ];
  let mockStore;
  let initialState;

  const RoleWrapper = ({ store, children }) => (
    <Provider store={ store }>
      <MemoryRouter initialEntries={ [ '/roles/', '/roles/123/', '/roles/' ] } initialIndex={ 1 }>
        { children }
      </MemoryRouter>
    </Provider>
  );

  beforeEach(() => {
    initialProps = {
      id: '123'
    };
    mockStore = configureStore(middlewares);
    initialState = {
      roleReducer: {
        ...rolesInitialState,
        isLoading: true,
        role: {
          name: 'Foo',
          uuid: '1'
        }
      }
    };
  });

  it('should call cancel action', () => {
    const store = mockStore(initialState);
    mock.onGet(`${RBAC_API_BASE}/roles/123/`).reply(200, { data: []});

    const wrapper = mount(
      <RoleWrapper store={ store }>
        <Route path="/roles/:id/" render={ (args) => <RemoveRoleModal { ...args } { ...initialProps } /> } />
      </RoleWrapper>
    );
    wrapper.find('button').first().simulate('click');
    expect(wrapper.find(MemoryRouter).children().props().history.location.pathname).toEqual('/roles/');
  });

  it('should call the remove action', (done) => {
    const store = mockStore(initialState);

    mock.onGet(`${RBAC_API_BASE}/roles/123/`).reply(200, { data: []});

    mock.onDelete(`${RBAC_API_BASE}/roles/123/`).reply(200);

    mock.onGet(`${RBAC_API_BASE}/roles/`).reply(200, { data: []});

    const wrapper = mount(
      <RoleWrapper store={ store }>
        <Route path="/roles/:id/" render={ (args) => <RemoveRoleModal { ...args } { ...initialProps } /> } />
      </RoleWrapper>
    );

    expect.extend({
      toContainObj(received, argument) {
        const result = this.equals(received,
          expect.arrayContaining([
            expect.objectContaining(argument)
          ])
        );
        if (result) {
          return { message: () => (`expected ${received} not to contain object ${argument}`), pass: true };
        } else {
          return { message: () => (`expected ${received} to contain object ${argument}`), pass: false };
        }
      }
    });

    wrapper.find('button').last().simulate('click');
    setImmediate(() => {
      const actions = store.getActions();
      expect(actions).toContainObj({ type: `${FETCH_ROLE}_PENDING` });
      expect(actions).toContainObj({ type: `${REMOVE_ROLE}_PENDING`,
        meta: { notifications: { fulfilled: { description: 'The role was removed successfully.',
          title: 'Success removing role', variant: 'success' }}}},);
      expect(actions).toContainObj({ type: `${FETCH_ROLE}_PENDING` });
      expect(actions).toContainObj({ type: ADD_NOTIFICATION,
        payload: expect.objectContaining({ description: 'The role was removed successfully.' }) });
      expect(actions).toContainObj({ type: `${REMOVE_ROLE}_FULFILLED` });
      expect(actions).toContainObj({ type: `${FETCH_ROLES}_PENDING` });
      expect(actions).toContainObj({ type: `${FETCH_ROLES}_FULFILLED` });
      done();
    });
  });
});

