import React from 'react';
import { act } from 'react-dom/test-utils';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { shallow } from 'enzyme';
import configureStore from 'redux-mock-store';
import { shallowToJson } from 'enzyme-to-json';

import { MemoryRouter, Route } from 'react-router-dom';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';
import AddGroupWizard from '../../../../smart-components/group/add-group/add-group-wizard';
import { ADD_NOTIFICATION } from '@redhat-cloud-services/frontend-components-notifications/index';
import { WarningModal } from '../../../../smart-components/common/warningModal';
import * as GroupActions from '../../../../redux/actions/group-actions';
import { ADD_GROUP } from '../../../../redux/action-types';

describe('<AddGroupWizard />', () => {
  let initialProps;
  let initialState;
  const middlewares = [thunk, promiseMiddleware, notificationsMiddleware()];
  let mockStore;

  const addGroupSpy = jest.spyOn(GroupActions, 'addGroup');

  const GroupWrapper = ({ store, children }) => (
    <Provider store={store}>
      <MemoryRouter initialEntries={['/groups/', '/groups/add-group/', '/groups/']} initialIndex={1}>
        {children}
      </MemoryRouter>
    </Provider>
  );

  beforeEach(() => {
    initialProps = {
      uuid: '123',
    };

    initialState = {
      roleReducer: {
        roles: [
          {
            label: 'foo',
            value: 'bar',
          },
        ],
      },
      groupReducer: {
        groups: {
          data: [
            {
              uuid: '123',
              name: 'SampleGroup',
            },
          ],
        },
      },
      userReducer: {
        selectedUser: {},
        isUserDataLoading: false,
        users: [],
      },
    };
    mockStore = configureStore(middlewares);
  });

  afterEach(() => {
    addGroupSpy.mockReset();
  });

  it('should render correctly', () => {
    const store = mockStore(initialState);
    const wrapper = shallow(
      <GroupWrapper store={store}>
        <AddGroupWizard {...initialProps} />
      </GroupWrapper>
    ).dive();

    setImmediate(() => {
      expect(shallowToJson(wrapper)).toMatchSnapshot();
    });
  });

  it('should show a warning modal on Cancel', async () => {
    const store = mockStore(initialState);
    addGroupSpy.mockResolvedValueOnce({ type: ADD_GROUP, payload: Promise.resolve({}) });

    const wrapper = mount(
      <GroupWrapper store={store}>
        <Route path="/groups/add-group/" render={() => <AddGroupWizard {...initialProps} />} />
      </GroupWrapper>
    );
    expect(wrapper.find(WarningModal).getElement().props.isOpen).not.toBeTruthy();
    const input = wrapper.find('input#group-name');
    input.getDOMNode().value = 'foo';
    input.simulate('change');
    wrapper.update();
    await act(async () => {
      wrapper.find('.pf-m-link').simulate('click');
    });
    wrapper.update();
    expect(wrapper.find(WarningModal).getElement().props.isOpen).toBeTruthy();
  });

  it('should not show a warning modal on Cancel when clean', async () => {
    const store = mockStore(initialState);

    const wrapper = mount(
      <GroupWrapper store={store}>
        <Route path="/groups/add-group/" render={() => <AddGroupWizard {...initialProps} />} />
      </GroupWrapper>
    );
    const expectedActions = expect.arrayContaining([
      expect.objectContaining({
        type: ADD_NOTIFICATION,
        payload: expect.objectContaining({ title: 'Adding group', variant: 'warning' }),
      }),
    ]);
    expect(wrapper.find(WarningModal).getElement().props.isOpen).not.toBeTruthy();
    await act(async () => {
      wrapper.find('.pf-m-link').simulate('click');
    });
    wrapper.update();

    expect(store.getActions()).toEqual(expectedActions);
    expect(wrapper.find(WarningModal)).toHaveLength(0);
  });
});
