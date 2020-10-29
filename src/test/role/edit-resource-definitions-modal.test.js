import React from 'react';
import { act } from 'react-dom/test-utils';
import { MemoryRouter, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';
import configureStore from 'redux-mock-store';
import toJson from 'enzyme-to-json';
import EditResourceDefinitionsModal from '../../smart-components/role/edit-resource-definitions-modal';
import { GET_RESOURCE_DEFINITIONS, GET_RESOURCE } from '../../redux/action-types';

import * as CostManagementActions from '../../redux/actions/cost-management-actions';

describe('EditResourceDefinitionsModal', () => {
  let mockStore;
  let initialState;

  const getResourceDefinitionsSpy = jest.spyOn(CostManagementActions, 'getResourceDefinitions');
  const getResourceSpy = jest.spyOn(CostManagementActions, 'getResource');

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
            {
              resourceDefinitions: [
                {
                  attributeFilter: {
                    key: 'test.test.test',
                    value: '111111',
                    operation: 'equal',
                  },
                },
              ],
              permission: 'cost-management:aws.account:read',
            },
          ],
        },
      },
      costReducer: {
        isLoading: false,
        resourceTypes: {
          meta: { count: 1 },
          data: [
            {
              value: 'aws.account',
              path: '/api/cost-management/v1/resource-types/aws-accounts/',
              count: 2,
            },
          ],
        },
        resources: {
          'aws-accounts': [{ value: '111111' }, { value: '111112' }, { value: '111113' }],
        },
        isLoadingResources: false,
      },
    };
  });

  it('should render edit resource definitions modal', async () => {
    getResourceDefinitionsSpy.mockImplementationOnce(() => ({ type: GET_RESOURCE_DEFINITIONS, payload: Promise.resolve({ data: 'something' }) }));
    getResourceSpy.mockImplementation(() => ({ type: GET_RESOURCE, payload: Promise.resolve({ data: 'something' }) }));
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider store={mockStore(initialState)}>
          <MemoryRouter initialEntries={['/roles/detail/1234/permission/cost-management:*:read/edit']}>
            <Route path="/roles/detail/:roleId/permission/:permissionId/edit" component={EditResourceDefinitionsModal} />
          </MemoryRouter>
        </Provider>
      );
    });
    wrapper.update();
    expect(toJson(wrapper.find('Modal'), { mode: 'mount' })).toMatchSnapshot();
  });

  it('should show warning modal on cancel with changes and close it', async () => {
    getResourceDefinitionsSpy.mockImplementationOnce(() => ({ type: GET_RESOURCE_DEFINITIONS, payload: Promise.resolve({ data: 'something' }) }));
    getResourceSpy.mockImplementationOnce(() => ({ type: GET_RESOURCE, payload: Promise.resolve({ data: 'something' }) }));
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider store={mockStore(initialState)}>
          <MemoryRouter initialEntries={['/roles/detail/1234/permission/cost-management:aws.account:read/edit']}>
            <Route path="/roles/detail/:roleId/permission/:permissionId/edit" component={EditResourceDefinitionsModal} />
          </MemoryRouter>
        </Provider>
      );
    });
    expect(wrapper.find('.ins-c-wizard__cancel-warning-header')).toHaveLength(0);
    wrapper.update();
    wrapper.find('.pf-c-button.pf-m-plain').at(4).simulate('click');
    wrapper.find('button#cancel-modal').first().simulate('click');
    expect(wrapper.find('.ins-c-wizard__cancel-warning-header')).toHaveLength(1);
    wrapper.find('button.pf-c-button.pf-m-plain').simulate('click');
    wrapper.update();
    expect(wrapper.find('.ins-c-wizard__cancel-warning-header')).toHaveLength(0);
  });

  it('should not show warning modal on cancel without changes', async () => {
    getResourceDefinitionsSpy.mockImplementationOnce(() => ({ type: GET_RESOURCE_DEFINITIONS, payload: Promise.resolve({ data: 'something' }) }));
    getResourceSpy.mockImplementationOnce(() => ({ type: GET_RESOURCE, payload: Promise.resolve({ data: 'something' }) }));
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider store={mockStore(initialState)}>
          <MemoryRouter initialEntries={['/roles/detail/1234/permission/cost-management:aws.account:read/edit']}>
            <Route path="/roles/detail/:roleId/permission/:permissionId/edit" component={EditResourceDefinitionsModal} />
          </MemoryRouter>
        </Provider>
      );
    });
    expect(wrapper.find('.ins-c-wizard__cancel-warning-header')).toHaveLength(0);
    wrapper.update();
    wrapper.find('button#cancel-modal').first().simulate('click');
    expect(wrapper.find('.ins-c-wizard__cancel-warning-header')).toHaveLength(0);
    expect(wrapper.find('.button#cancel-modal')).toHaveLength(0);
  });

  it('should show warning modal on close with changes', async () => {
    getResourceDefinitionsSpy.mockImplementationOnce(() => ({ type: GET_RESOURCE_DEFINITIONS, payload: Promise.resolve({ data: 'something' }) }));
    getResourceSpy.mockImplementationOnce(() => ({ type: GET_RESOURCE, payload: Promise.resolve({ data: 'something' }) }));
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider store={mockStore(initialState)}>
          <MemoryRouter initialEntries={['/roles/detail/1234/permission/cost-management:aws.account:read/edit']}>
            <Route path="/roles/detail/:roleId/permission/:permissionId/edit" component={EditResourceDefinitionsModal} />
          </MemoryRouter>
        </Provider>
      );
    });
    expect(wrapper.find('.ins-c-wizard__cancel-warning-header')).toHaveLength(0);
    wrapper.update();
    wrapper.find('.pf-c-button.pf-m-plain').at(4).simulate('click');
    wrapper.find('.pf-c-button.pf-m-plain').first().simulate('click');
    expect(wrapper.find('.ins-c-wizard__cancel-warning-header')).toHaveLength(1);
  });

  it('should show alert on removing last resource and cancel', async () => {
    getResourceDefinitionsSpy.mockImplementationOnce(() => ({ type: GET_RESOURCE_DEFINITIONS, payload: Promise.resolve({ data: 'something' }) }));
    getResourceSpy.mockImplementationOnce(() => ({ type: GET_RESOURCE, payload: Promise.resolve({ data: 'something' }) }));
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider store={mockStore(initialState)}>
          <MemoryRouter initialEntries={['/roles/detail/1234/permission/cost-management:aws.account:read/edit']}>
            <Route path="/roles/detail/:roleId/permission/:permissionId/edit" component={EditResourceDefinitionsModal} />
          </MemoryRouter>
        </Provider>
      );
    });
    wrapper.update();
    expect(wrapper.find('.pf-c-alert')).toHaveLength(0);
    wrapper.find('.pf-c-button.pf-m-plain').at(4).simulate('click');
    expect(wrapper.find('.pf-c-alert')).toHaveLength(1);
  });

  it('should show loading modal on close', async () => {
    getResourceDefinitionsSpy.mockImplementationOnce(() => ({ type: GET_RESOURCE_DEFINITIONS, payload: Promise.resolve({ data: 'something' }) }));
    getResourceSpy.mockImplementationOnce(() => ({ type: GET_RESOURCE, payload: Promise.resolve({ data: 'something' }) }));
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <Provider store={mockStore({ ...initialState, costReducer: { ...initialState.costReducer, isLoading: true, isLoadingResources: true } })}>
          <MemoryRouter initialEntries={['/roles/detail/1234/permission/cost-management:aws.account:read/edit']}>
            <Route path="/roles/detail/:roleId/permission/:permissionId/edit" component={EditResourceDefinitionsModal} />
          </MemoryRouter>
        </Provider>
      );
    });
    wrapper.update();
    expect(wrapper.find('.pf-c-spinner')).toHaveLength(1);
    wrapper.find('.pf-c-button.pf-m-plain').simulate('click');
    expect(wrapper.find('.pf-c-spinner')).toHaveLength(0);
  });
});
