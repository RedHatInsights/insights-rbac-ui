import React from 'react';
import { act } from 'react-dom/test-utils';
import { MemoryRouter, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';
import configureStore from 'redux-mock-store';
import toJson from 'enzyme-to-json';
import { FETCH_ROLE } from '../../redux/action-types';
import ResourceDefinitions from '../../smart-components/role/role-resource-definitions';

import * as RoleActions from '../../redux/actions/role-actions';

describe('RoleResourceDefinitions', () => {
  let mockStore;
  let initialState;

  const fetchRoleSpy = jest.spyOn(RoleActions, 'fetchRole');

  beforeEach(() => {
    mockStore = configureStore();
    initialState = {
      roleReducer: {
        isRecordLoading: false,
        selectedRole: {
          uuid: '1234',
          display_name: 'name',
          description: 'description',
          access: [
            {
              resourceDefinitions: Array(21).fill({
                attributeFilter: {
                  key: 'test.test.test',
                  value: 'test',
                  operation: 'equal',
                },
              }),
              permission: 'cost-management:*:read',
            },
          ],
        },
      },
    };
  });

  it('should render resource definitions table', async () => {
    fetchRoleSpy.mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({ data: 'something' }) }));
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider store={mockStore(initialState)}>
          <MemoryRouter initialEntries={['/roles/detail/1234/permission/cost-management:*:read']}>
            <Route path="/roles/detail/:roleId/permission/:permissionId" component={ResourceDefinitions} />
          </MemoryRouter>
        </Provider>
      );
    });
    wrapper.update();
    expect(wrapper.find('.pf-c-pagination__nav button').first().props().disabled).toBe(true);
    expect(toJson(wrapper.find('.pf-c-table'), { mode: 'mount' })).toMatchSnapshot();
  });

  it('should not fetch data on filter', async () => {
    fetchRoleSpy.mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({ data: 'something' }) }));
    let wrapper;
    const store = mockStore(initialState);
    await act(async () => {
      wrapper = mount(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/roles/detail/1234/permission/cost-management:*:read']}>
            <Route path="/roles/detail/:roleId/permission/:permissionId" component={ResourceDefinitions} />
          </MemoryRouter>
        </Provider>
      );
    });
    const expectedActions = [expect.objectContaining({ type: FETCH_ROLE })];
    expect(store.getActions()).toEqual(expectedActions);
    wrapper.update();
    store.clearActions();
    wrapper
      .find('input#filter-by-string')
      .first()
      .simulate('change', { target: { value: 'c' } });
    expect(store.getActions()).toEqual([]);
  });

  it('should not fetch data on page change', async () => {
    fetchRoleSpy.mockImplementationOnce(() => ({ type: FETCH_ROLE, payload: Promise.resolve({ data: 'something' }) }));
    let wrapper;
    const store = mockStore(initialState);
    await act(async () => {
      wrapper = mount(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/roles/detail/1234/permission/cost-management:*:read']}>
            <Route path="/roles/detail/:roleId/permission/:permissionId" component={ResourceDefinitions} />
          </MemoryRouter>
        </Provider>
      );
    });
    const expectedActions = [expect.objectContaining({ type: FETCH_ROLE })];
    expect(store.getActions()).toEqual(expectedActions);
    store.clearActions();
    wrapper.find('button[data-action="last"]').first().simulate('click');
    expect(store.getActions()).toEqual([]);
  });
});
