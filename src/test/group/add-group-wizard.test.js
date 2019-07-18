import React from 'react';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { shallow } from 'enzyme';
import configureStore from 'redux-mock-store' ;
import { shallowToJson } from 'enzyme-to-json';

import { MemoryRouter } from 'react-router-dom';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';
import { RBAC_API_BASE } from '../../utilities/constants';
import AddPortfolioWizard from '../../smart-components/group/add-group/add-group-wizard';

describe('<AddGroupWizard />', () => {
  let initialProps;
  let initialState;
  const middlewares = [ thunk, promiseMiddleware(), notificationsMiddleware() ];
  let mockStore;
  const ComponentWrapper = ({ store, children, groupId }) => (
    <Provider store={ store }>
      <MemoryRouter initialEntries={ [ `groups/${groupId}` ] }>
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
      },
      groupReducer: {
        groups: { data: [{
          uuid: '123',
          name: 'SampleGroup'
        }]}
      }
    };
    mockStore = configureStore(middlewares);
  });

  it('should render correctly', () => {
    const store = mockStore(initialState);
    apiClientMock.get(`${RBAC_API_BASE}/roles`, mockOnce({ body: { data: []}}));
    const wrapper = shallow(<ComponentWrapper store={ store }><AddPortfolioWizard { ...initialProps } /></ComponentWrapper>).dive();

    setImmediate(() => {
      expect(shallowToJson(wrapper)).toMatchSnapshot();
    });
  });
});

