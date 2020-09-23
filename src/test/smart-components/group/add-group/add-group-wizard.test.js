import React from 'react';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { shallow } from 'enzyme';
import configureStore from 'redux-mock-store';
import { shallowToJson } from 'enzyme-to-json';

import { MemoryRouter, Route } from 'react-router-dom';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';
import { RBAC_API_BASE } from '../../../../utilities/constants';
import AddGroupWizard from '../../../../smart-components/group/add-group/add-group-wizard';
import { ADD_NOTIFICATION } from '@redhat-cloud-services/frontend-components-notifications/index';
import { WarningModal } from '../../../../smart-components/common/warningModal';

describe('<AddGroupWizard />', () => {
  let initialProps;
  let initialState;
  const middlewares = [thunk, promiseMiddleware, notificationsMiddleware()];
  let mockStore;

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

  it('should render correctly', () => {
    const store = mockStore(initialState);
    apiClientMock.get(`${RBAC_API_BASE}/groups`, mockOnce({ body: { data: [] } }));
    apiClientMock.get(`${RBAC_API_BASE}/roles`, mockOnce({ body: { data: [] } }));
    const wrapper = shallow(
      <GroupWrapper store={store}>
        <AddGroupWizard {...initialProps} />
      </GroupWrapper>
    ).dive();

    setImmediate(() => {
      expect(shallowToJson(wrapper)).toMatchSnapshot();
    });
  });

  it('should show a warning modal on Cancel', () => {
    const store = mockStore(initialState);

    apiClientMock.put(
      `${RBAC_API_BASE}/groups/`,
      mockOnce((req, res) => {
        expect(req).toBeTruthy();
        return res.status(200);
      })
    );

    apiClientMock.get(
      `${RBAC_API_BASE}/groups/`,
      mockOnce((req, res) => {
        expect(req).toBeTruthy();
        return res.status(200).body({ data: [] });
      })
    );

    apiClientMock.get(
      `${RBAC_API_BASE}/roles/`,
      mockOnce((req, res) => {
        expect(req).toBeTruthy();
        return res.status(200).body({ data: [] });
      })
    );

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
    wrapper.find('.pf-m-link').simulate('click');
    wrapper.update();
    expect(wrapper.find(WarningModal).getElement().props.isOpen).toBeTruthy();
  });

  it('should not show a warning modal on Cancel when clean', (done) => {
    const store = mockStore(initialState);

    apiClientMock.put(
      `${RBAC_API_BASE}/groups/`,
      mockOnce((req, res) => {
        expect(req).toBeTruthy();
        return res.status(200);
      })
    );

    apiClientMock.get(
      `${RBAC_API_BASE}/groups/`,
      mockOnce((req, res) => {
        expect(req).toBeTruthy();
        return res.status(200).body({ data: [] });
      })
    );

    apiClientMock.get(
      `${RBAC_API_BASE}/roles/`,
      mockOnce((req, res) => {
        expect(req).toBeTruthy();
        return res.status(200).body({ data: [] });
      })
    );

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
    wrapper.find('.pf-m-link').simulate('click');

    setImmediate(() => {
      expect(store.getActions()).toEqual(expectedActions);
      expect(wrapper.find(WarningModal)).toHaveLength(0);
      done();
    });
  });
});
