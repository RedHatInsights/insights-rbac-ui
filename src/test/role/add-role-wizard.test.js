import React from 'react';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { shallow } from 'enzyme';
import configureStore from 'redux-mock-store' ;
import { shallowToJson } from 'enzyme-to-json';

import { MemoryRouter, Route } from 'react-router-dom';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';
import AddRoleWizard from '../../smart-components/role/add-role/add-role-wizard';
import { ADD_NOTIFICATION } from '@redhat-cloud-services/frontend-components-notifications/index';
import { mount } from 'enzyme/build/index';
import { WarningModal } from '../../smart-components/common/warningModal';

describe('<AddRoleWizard />', () => {
  let initialProps;
  let initialState;
  const middlewares = [ thunk, promiseMiddleware, notificationsMiddleware() ];
  let mockStore;

  const RoleWrapper = ({ store, children }) => (
    <Provider store={ store }>
      <MemoryRouter initialEntries={ [ '/roles/add-role/' ] }>
        { children }
      </MemoryRouter>
    </Provider>
  );

  beforeEach(() => {
    initialProps = { };
    initialState = {
      roleReducer: {
        roles: [{
          label: 'foo',
          value: 'bar'
        }]
      }
    };
    mockStore = configureStore(middlewares);
  });

  it('should render correctly', () => {
    const store = mockStore(initialState);
    const wrapper = shallow(<RoleWrapper store={ store }><AddRoleWizard { ...initialProps } /></RoleWrapper>).dive();

    setImmediate(() => {
      expect(shallowToJson(wrapper)).toMatchSnapshot();
    });
  });

  it('should show a warning modal on Cancel', () => {
    const store = mockStore(initialState);

    const wrapper = mount(
      <RoleWrapper store={ store }>
        <Route path="/roles/add-role/" render={ () => <AddRoleWizard { ...initialProps } /> } />
      </RoleWrapper>
    );
    expect(wrapper.find(WarningModal).getElement().props.isOpen).not.toBeTruthy();
    const input = wrapper.find('input#name');
    input.getDOMNode().value = 'foo';
    input.simulate('change');
    wrapper.update();
    wrapper.find('.pf-m-link').simulate('click');
    wrapper.update();
    expect(wrapper.find(WarningModal).getElement().props.isOpen).toBeTruthy();
  });

  it('should not show a warning modal on Cancel when clean', (done) => {
    const store = mockStore(initialState);

    const wrapper = mount(
      <RoleWrapper store={ store }>
        <Route path="/roles/add-role/" render={ () => <AddRoleWizard { ...initialProps } /> } />
      </RoleWrapper>
    );
    const expectedActions = expect.arrayContaining([
      expect.objectContaining({
        type: ADD_NOTIFICATION,
        payload: expect.objectContaining({ title: 'Creating role was canceled by the user', variant: 'warning' })
      }) ]);
    expect(wrapper.find(WarningModal).getElement().props.isOpen).not.toBeTruthy();
    wrapper.find('.pf-c-button.pf-m-primary').simulate('click');
    wrapper.update();
    wrapper.find('.pf-m-link').simulate('click');

    setImmediate(() => {
      expect(store.getActions()).toEqual(expectedActions);
      expect(wrapper.find(WarningModal)).toHaveLength(0);
      done();
    });
  });
});
