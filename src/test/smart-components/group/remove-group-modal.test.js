import React from 'react';
import { act } from 'react-dom/test-utils';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';
import configureStore from 'redux-mock-store';
import { MemoryRouter, Route } from 'react-router-dom';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';
import RemoveGroupModal from '../../../smart-components/group/remove-group-modal';
import { groupsInitialState } from '../../../redux/reducers/group-reducer';
import { FETCH_GROUP, FETCH_GROUPS, REMOVE_GROUPS } from '../../../redux/action-types';
import { Button } from '@patternfly/react-core';
import pathnames from '../../../utilities/pathnames';
import * as GroupActions from '../../../redux/actions/group-actions';

jest.mock('../../../redux/actions/group-actions', () => {
  const actions = jest.requireActual('../../../redux/actions/group-actions');
  return {
    __esModule: true,
    ...actions,
  };
});

describe('<RemoveGroupModal />', () => {
  let initialProps;
  const middlewares = [thunk, promiseMiddleware, notificationsMiddleware()];
  let mockStore;
  let initialState;

  const fetchGroupSpy = jest.spyOn(GroupActions, 'fetchGroup');
  const fetchGroupsSpy = jest.spyOn(GroupActions, 'fetchGroups');
  const removeGroupsSpy = jest.spyOn(GroupActions, 'removeGroups');

  const GroupWrapper = ({ store }) => (
    <Provider store={store}>
      <MemoryRouter initialEntries={['/groups/', '/groups/removegroups']} initialIndex={2}>
        <Route
          path="/groups/removegroups"
          render={(args) => (
            <RemoveGroupModal
              {...args}
              {...initialProps}
              isModalOpen
              groupsUuid={[{ uuid: '123' }]}
              pagination={{ limit: 0 }}
              filters={{}}
              cancelRoute={pathnames.groups}
            />
          )}
        />
      </MemoryRouter>
    </Provider>
  );

  beforeEach(() => {
    initialProps = {
      postMethod: jest.fn(),
    };
    mockStore = configureStore(middlewares);
    initialState = {
      groupReducer: {
        ...groupsInitialState,
        isLoading: true,
        selectedGroup: {
          loaded: true,
        },
      },
    };
  });

  afterEach(() => {
    removeGroupsSpy.mockReset();
    fetchGroupSpy.mockReset();
  });

  it('should call cancel action', () => {
    const store = mockStore(initialState);
    fetchGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUP, payload: Promise.resolve({}) }));
    fetchGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUP, payload: Promise.resolve({}) }));
    const wrapper = mount(<GroupWrapper store={store} />);

    wrapper.find(Button).last().simulate('click');
    expect(wrapper.find(MemoryRouter).children().props().history.location.pathname).toEqual(pathnames.groups);
  });

  it('should call the remove action', async () => {
    const store = mockStore(initialState);

    fetchGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUP, payload: Promise.resolve({}) }));
    fetchGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUP, payload: Promise.resolve({}) }));
    fetchGroupsSpy.mockImplementationOnce(() => ({ type: FETCH_GROUPS, payload: Promise.resolve({}) }));
    removeGroupsSpy.mockImplementationOnce(() => ({ type: REMOVE_GROUPS, payload: Promise.resolve({}) }));

    let wrapper;
    await act(async () => {
      wrapper = mount(<GroupWrapper store={store} />);
    });
    wrapper.update();

    const input = wrapper.find({ type: 'checkbox' }).first();
    input.getDOMNode().checked = !input.getDOMNode().checked;
    await act(async () => {
      input.simulate('change');
    });
    wrapper.update();
    await act(async () => {
      wrapper.find(Button).at(1).simulate('click');
    });
    expect(initialProps.postMethod).toHaveBeenCalled();
    expect(removeGroupsSpy).toHaveBeenCalledWith(['123']);
  });
});
