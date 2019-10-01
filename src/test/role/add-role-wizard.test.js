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

describe('<AddRoleWizard />', () => {
  let initialProps;
  let initialState;
  const middlewares = [ thunk, promiseMiddleware(), notificationsMiddleware() ];
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

  it('should post a warning message on Cancel', (done) => {
    const store = mockStore(initialState);

    const wrapper = mount(
      <RoleWrapper store={ store }>
        <Route path="/roles/add-role/" render={ () => <AddRoleWizard { ...initialProps } /> } />
      </RoleWrapper>
    );
    const expectedActions = expect.arrayContaining([
      expect.objectContaining({
        type: ADD_NOTIFICATION,
        payload: expect.objectContaining({ title: 'Adding role', variant: 'warning' })
      }) ]);

    wrapper.find('Button').at(0).simulate('click');
    setImmediate(() => {
      expect(store.getActions()).toEqual(expectedActions);
      done();
    });
  });
});
