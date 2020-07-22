import React from 'react';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';
import configureStore from 'redux-mock-store' ;
import { MemoryRouter, Route } from 'react-router-dom';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';
import { mock } from '../../__mocks__/apiMock';
import { RBAC_API_BASE } from '../../../utilities/constants';
import RemoveGroupModal from '../../../smart-components/group/remove-group-modal';
import { groupsInitialState } from '../../../redux/reducers/group-reducer';
import { FETCH_GROUP, REMOVE_GROUPS } from '../../../redux/action-types';
import { Button } from '@patternfly/react-core';

describe('<RemoveGroupModal />', () => {
  let initialProps;
  const middlewares = [ thunk, promiseMiddleware, notificationsMiddleware() ];
  let mockStore;
  let initialState;

  const GroupWrapper = ({ store }) => (
    <Provider store={ store }>
      <MemoryRouter initialEntries={ [ '/groups/', '/groups/removegroups' ] } initialIndex={ 2 }>
        <Route path="/groups/removegroups" render={ (args) => <RemoveGroupModal { ...args } { ...initialProps }
          isModalOpen
          groupsUuid={ [{ uuid: '123' }] } /> } />
      </MemoryRouter>
    </Provider>
  );

  beforeEach(() => {
    initialProps = {
      postMethod: jest.fn()
    };
    mockStore = configureStore(middlewares);
    initialState = {
      groupReducer: {
        ...groupsInitialState,
        isLoading: true,
        selectedGroup: {
          loaded: true
        }
      }
    };
  });

  it('should call cancel action', () => {
    const store = mockStore(initialState);
    mock.onGet(`${RBAC_API_BASE}/groups/123/`).reply(200, { data: []});

    const wrapper = mount(
      <GroupWrapper store={ store } />
    );

    wrapper.find(Button).last().simulate('click');
    expect(wrapper.find(MemoryRouter).children().props().history.location.pathname).toEqual('/groups/');
  });

  it('should call the remove action', (done) => {
    const store = mockStore(initialState);

    mock.onGet(`${RBAC_API_BASE}/groups/123/`).reply(200, { data: []});
    mock.onDelete(`${RBAC_API_BASE}/groups/123/`).reply(200);
    mock.onGet(`${RBAC_API_BASE}/groups/`).reply(200, { data: []});

    const wrapper = mount(
      <GroupWrapper store={ store }/>
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

    const input = wrapper.find({ type: 'checkbox' }).first();
    input.getDOMNode().checked = !input.getDOMNode().checked;
    input.simulate('change');
    wrapper.update();
    wrapper.find(Button).at(1).simulate('click');

    setImmediate(() => {
      const actions = store.getActions();
      expect(actions).toContainObj({ type: `${FETCH_GROUP}_PENDING` });
      expect(actions).toContainObj({ type: `${REMOVE_GROUPS}_PENDING` });
      expect(actions).toContainObj({ type: `${FETCH_GROUP}_FULFILLED` });
      expect(actions).toContainObj({ type: `@@INSIGHTS-CORE/NOTIFICATIONS/ADD_NOTIFICATION`,
        payload: expect.objectContaining({ title: 'Group deleted successfully' }) });
      expect(actions).toContainObj({ type: `${REMOVE_GROUPS}_FULFILLED` });
      expect(initialProps.postMethod).toHaveBeenCalled();
      done();
    });
  });
});

