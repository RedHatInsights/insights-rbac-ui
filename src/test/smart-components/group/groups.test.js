import React from 'react';
import { act } from 'react-dom/test-utils';
import thunk from 'redux-thunk';
import { MemoryRouter as Router } from 'react-router-dom';
import configureStore from 'redux-mock-store' ;
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import promiseMiddleware from 'redux-promise-middleware';
import Groups from '../../../smart-components/group/groups';
import { mock } from '../../__mocks__/apiMock';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications';
import { groupsInitialState } from '../../../redux/reducers/group-reducer';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { getUserMock } from '../../../../config/setupTests';

describe('<Groups />', () => {

  let enhanceState;
  const middlewares = [ thunk, promiseMiddleware, notificationsMiddleware() ];
  let mockStore;
  let initialState;

  beforeEach(() => {
    enhanceState = {
      data: [
        {
          uuid: '19eccddf-7e6a-41a2-b050-3e67f0af4ed1',
          name: 'Custom default user access',
          description: 'Default group that contains default permissions for new users.',
          principalCount: 0,
          platform_default: true,
          roleCount: 6,
          created: '2019-12-03T18:56:01.184350Z',
          modified: '2020-02-06T08:50:12.064832Z',
          system: false
        }
      ],
      meta: {
        count: 153,
        limit: 10,
        offset: 0
      }
    };
    mockStore = configureStore(middlewares);
    initialState = { groupReducer: { ...groupsInitialState, groups: enhanceState }};
  });

  afterEach(() => {
    mock.reset();
  });

  it('should render group list correctly', async() => {
    mock.onGet(`/api/rbac/v1/groups/?limit=10&offset=0&name=`).replyOnce(200, {});
    let wrapper;
    const store = mockStore(initialState);
    await act(async () => {
      wrapper = mount(
        <Provider store={ store }>
          <Router initialEntries={ [ '/groups' ] }>
            <Groups />
          </Router>
        </Provider>
      );
    });
    expect(wrapper.find(TableToolbarView)).toHaveLength(1);
  });

  it('should fetch groups on mount', () => {
    const store = mockStore(initialState);
    mock.onGet(`/api/rbac/v1/groups/?limit=10&offset=0&name=`).replyOnce(200, {});
    mount(
      <Provider store={ store }>
        <Router>
          <Groups />
        </Router>,
      </Provider>
    );
    const expectedPayload = [
      { type: 'FETCH_GROUPS_PENDING' }
    ];
    expect(store.getActions()).toEqual(expectedPayload);
  });

  it('should fetch groups on next page click', async() => {
    const store = mockStore(initialState);
    mock.onGet(`/api/rbac/v1/groups/?limit=10&offset=0&name=`).replyOnce(200, {});
    mock.onGet(`/api/rbac/v1/groups/?limit=10&offset=10&name=&order_by=`).replyOnce(200, {});
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider store={ store }>
          <Router initialEntries={ [ '/groups' ] }>
            <Groups />
          </Router>
        </Provider>
      );
    });
    store.clearActions();
    await act(async () => {
      wrapper.find('.pf-c-pagination__nav .pf-c-button').at(1).simulate('click');
    });
    const expectedPayloadAfter = [
      { type: 'FETCH_GROUPS_PENDING' },
      { type: 'FETCH_GROUPS_FULFILLED', payload: {
        ...getUserMock
      }}
    ];
    expect(store.getActions()).toEqual(expectedPayloadAfter);
  });

  it('should fetch groups on filter and cancel filter', async() => {
    jest.useFakeTimers();
    const store = mockStore(initialState);
    const filterValue = 'filterValue';
    mock.onGet(`/api/rbac/v1/groups/?limit=10&offset=0&name=`).replyOnce(200, {});
    mock.onGet(`/api/rbac/v1/groups/?limit=10&offset=0&name=${filterValue}`).replyOnce(200, {});
    mock.onGet(`/api/rbac/v1/groups/?limit=10&offset=0&name=`).replyOnce(200, {});
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider store={ store }>
          <Router initialEntries={ [ '/groups' ] }>
            <Groups />
          </Router>
        </Provider>
      );
    });
    store.clearActions();
    await act(async () => {
      wrapper.find('input#filter-by-string').simulate('change', { target: { value: filterValue }});
    });
    const expectedFilterPayload = [
      { type: 'FETCH_GROUPS_PENDING' }
    ];
    jest.runAllTimers();
    expect(store.getActions()).toEqual(expectedFilterPayload);
    store.clearActions();
    wrapper.update();
    await act(async () => {
      wrapper.find('#ins-primary-data-toolbar .ins-c-chip-filters').simulate('click');
    });
    const expectedCancelPayload = [
      { type: 'FETCH_GROUPS_FULFILLED', payload: {
        ...getUserMock
      }}
    ];
    expect(store.getActions()).toEqual(expectedCancelPayload);
  });

  it('should fetch groups on sort click', async() => {
    const store = mockStore(initialState);
    mock.onGet(`/api/rbac/v1/groups/?limit=10&offset=0&name=`).replyOnce(200, {});
    mock.onGet(`/api/rbac/v1/groups/?limit=10&offset=0&name=&order_by=name`).replyOnce(200, {});
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider store={ store }>
          <Router initialEntries={ [ '/groups' ] }>
            <Groups />
          </Router>
        </Provider>
      );
    });
    store.clearActions();
    await act(async () => {
      wrapper.find('span.pf-c-table__sort-indicator').first().simulate('click');
    });
    const expectedPayloadAfter = [
      { type: 'FETCH_GROUPS_PENDING' },
      { type: 'FETCH_GROUPS_FULFILLED', payload: {
          ...getUserMock
      }}
    ];
    expect(store.getActions()).toEqual(expectedPayloadAfter);
  });
});
