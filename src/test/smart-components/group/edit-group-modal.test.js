import React from 'react';
import { act } from 'react-dom/test-utils';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { shallow, mount } from 'enzyme';
import configureStore from 'redux-mock-store';
import { shallowToJson } from 'enzyme-to-json';
import { Button } from '@patternfly/react-core';
import { MemoryRouter, Route } from 'react-router-dom';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';
import EditGroupModal from '../../../smart-components/group/edit-group-modal';
import { groupsInitialState } from '../../../redux/reducers/group-reducer';
import * as GroupActions from '../../../redux/actions/group-actions';
import { FETCH_GROUP } from '../../../redux/action-types';

describe('<EditGroupModal />', () => {
  let initialProps;
  const middlewares = [thunk, promiseMiddleware, notificationsMiddleware()];
  let mockStore;
  let initialState;

  const fetchGroupSpy = jest.spyOn(GroupActions, 'fetchGroup');

  const GroupWrapper = ({ store, children, initialEntries = [] }) => (
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </Provider>
  );

  beforeEach(() => {
    initialProps = {
      closeUrl: '/groups',
      groupData: {
        name: 'Foo',
        id: '1',
      },
    };
    mockStore = configureStore(middlewares);
    initialState = {
      groupReducer: {
        ...groupsInitialState,
        isLoading: true,
        groupData: {
          name: 'Foo',
          id: '1',
        },
      },
    };
  });

  afterEach(() => {
    fetchGroupSpy.mockReset();
  });

  it('should render correctly', () => {
    const store = mockStore(initialState);
    const wrapper = shallow(
      <Provider store={store}>
        <EditGroupModal {...initialProps} />
      </Provider>
    );
    expect(shallowToJson(wrapper)).toMatchSnapshot();
  });

  it('should redirect back to close URL', async () => {
    const store = mockStore(initialState);
    fetchGroupSpy.mockImplementationOnce(() => ({ type: FETCH_GROUP, payload: Promise.resolve({}) }));
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <GroupWrapper store={store} initialEntries={['/groups/edit/:id']}>
          <Route to="/groups/edit/:id" render={(args) => <EditGroupModal {...initialProps} {...args} isOpen />} />
        </GroupWrapper>
      );
    });
    wrapper.update();

    wrapper.find(Button).first().simulate('click');
    expect(wrapper.find(MemoryRouter).instance().history.location.pathname).toEqual('/groups');
  });
});
