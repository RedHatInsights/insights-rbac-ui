import React from 'react';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { shallow, mount } from 'enzyme';
import configureStore from 'redux-mock-store' ;
import { shallowToJson } from 'enzyme-to-json';
import { Button } from '@patternfly/react-core';
import { MemoryRouter, Route } from 'react-router-dom';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';
import { RBAC_API_BASE } from '../../../utilities/constants';
import EditGroupModal from '../../../smart-components/group/edit-group-modal';
import { groupsInitialState } from '../../../redux/reducers/group-reducer';
import { componentTypes } from '@data-driven-forms/react-form-renderer/dist/index';

describe('<EditGroupModal />', () => {
  let initialProps;
  const middlewares = [ thunk, promiseMiddleware(), notificationsMiddleware() ];
  let mockStore;
  let initialState;

  const GroupWrapper = ({ store, children, initialEntries = []}) => (
    <Provider store={ store }>
      <MemoryRouter initialEntries={ initialEntries }>
        { children }
      </MemoryRouter>
    </Provider>
  );

  beforeEach(() => {
    initialProps = {
      closeUrl: '/groups',
      groupData: {
        name: 'Foo',
        id: '1'
      }
    };
    mockStore = configureStore(middlewares);
    initialState = {
      groupReducer: {
        ...groupsInitialState,
        isLoading: true,
        groupData: {
          name: 'Foo',
          id: '1'
        }
      }
    };
  });

  it('should render correctly', () => {
    const wrapper = shallow(<EditGroupModal { ...initialProps } />);
    expect(shallowToJson(wrapper)).toMatchSnapshot();
  });

  it('should redirect back to close URL', (done) => {
    const store = mockStore(initialState);

    apiClientMock.get(`${RBAC_API_BASE}/groups/action-modal/1`, mockOnce(
      { body: {
        component: componentTypes.TEXTAREA_FIELD,
        name: 'comments',
        type: 'text',
        isRequired: false,
        label: 'Comment'
      }
      }));

    const wrapper = mount(
      <GroupWrapper store={ store } initialEntries={ [ '/foo/url' ] }>
        <Route to="/foo/url" render={ args => <EditGroupModal { ...initialProps } { ...args } /> }  />
      </GroupWrapper>
    );

    setImmediate(() => {
      wrapper.find(Button).first().simulate('click');
      expect(wrapper.find(MemoryRouter).instance().history.location.pathname).toEqual('/groups');
      done();
    });
  });
});

