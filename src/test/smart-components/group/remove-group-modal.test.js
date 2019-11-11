import React from 'react';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';
import configureStore from 'redux-mock-store' ;
import { MemoryRouter, Route } from 'react-router-dom';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware, ADD_NOTIFICATION } from '@redhat-cloud-services/frontend-components-notifications/';
import { mock } from '../../__mocks__/apiMock';
import { RBAC_API_BASE } from '../../../utilities/constants';
import RemoveGroupModal from '../../../smart-components/group/remove-group-modal';
import { groupsInitialState } from '../../../redux/reducers/group-reducer';
import { REMOVE_GROUP, FETCH_GROUP } from '../../../redux/action-types';

describe('<RemoveGroupModal />', () => {
  let initialProps;
  const middlewares = [ thunk, promiseMiddleware(), notificationsMiddleware() ];
  let mockStore;
  let initialState;

  const GroupWrapper = ({ store, children }) => (
    <Provider store={ store }>
      <MemoryRouter initialEntries={ [ '/groups/', '/groups/123/', '/groups/' ] } initialIndex={ 1 }>
        { children }
      </MemoryRouter>
    </Provider>
  );

  beforeEach(() => {
    initialProps = {
      id: '123',
      postMethod: jest.fn()
    };
    mockStore = configureStore(middlewares);
    initialState = {
      groupReducer: {
        ...groupsInitialState,
        isLoading: true,
        group: {
          name: 'Foo',
          uuid: '1'
        }
      }
    };
  });

  it('should call cancel action', () => {
    const store = mockStore(initialState);
    mock.onGet(`${RBAC_API_BASE}/groups/123/`).reply(200, { data: []});

    const wrapper = mount(
      <GroupWrapper store={ store }>
        <Route path="/groups/:id/" render={ (args) => <RemoveGroupModal { ...args } { ...initialProps } /> } />
      </GroupWrapper>
    );
    wrapper.find('button').first().simulate('click');
    expect(wrapper.find(MemoryRouter).children().props().history.location.pathname).toEqual('/groups/');
  });

  it('should call the remove action', (done) => {
    const store = mockStore(initialState);

    mock.onGet(`${RBAC_API_BASE}/groups/123/`).reply(200, { data: []});
    mock.onDelete(`${RBAC_API_BASE}/groups/123/`).reply(200);
    mock.onGet(`${RBAC_API_BASE}/groups/`).reply(200, { data: []});

    const wrapper = mount(
      <GroupWrapper store={ store }>
        <Route path="/groups/:id/" render={ (args) => <RemoveGroupModal { ...args } { ...initialProps } /> } />
      </GroupWrapper>
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
      expect(actions).toContainObj({ type: `${FETCH_GROUP}_PENDING` });
      expect(actions).toContainObj({ type: `${REMOVE_GROUP}_PENDING`,
        meta: { notifications: { fulfilled: { description: 'The group was removed successfully.',
          title: 'Success removing group', variant: 'success' }}}},);
      expect(actions).toContainObj({ type: `${FETCH_GROUP}_PENDING` });
      expect(actions).toContainObj({ type: ADD_NOTIFICATION,
        payload: expect.objectContaining({ description: 'The group was removed successfully.' }) });
      expect(actions).toContainObj({ type: `${REMOVE_GROUP}_FULFILLED` });
      expect(initialProps.postMethod).toHaveBeenCalled();
      done();
    });
  });
});

