import React from 'react';
import { act } from 'react-dom/test-utils';
import { mount } from 'enzyme';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import CommonBundleView, { createFilter } from '../../../smart-components/myUserAccess/CommonBundleView';
import MUARolesTable from '../../../smart-components/myUserAccess/MUARolesTable';
import OrgAdminContext from '../../../utilities/org-admin-context';
import MUAAccessTable from '../../../smart-components/myUserAccess/MUAAccessTable';

import * as RoleActions from '../../../redux/actions/role-actions';
import * as AccessActions from '../../../redux/actions/access-actions';
import { FETCH_ROLES, GET_PRINCIPAL_ACCESS } from '../../../redux/action-types';

// TODO: Add permissions back when we support partial matching

const ComponentWrapper = ({ store, isOrgAdmin, children }) => (
  <MemoryRouter>
    <Provider store={store}>
      <OrgAdminContext.Provider value={isOrgAdmin}>{children}</OrgAdminContext.Provider>
    </Provider>
  </MemoryRouter>
);

describe('<CommonBundleView />', () => {
  const rolesMock = {
    type: FETCH_ROLES,
    payload: Promise.resolve({
      data: [],
      meta: {},
    }),
  };

  const userAccessMock = {
    type: GET_PRINCIPAL_ACCESS,
    payload: Promise.resolve({
      data: [],
      meta: {},
    }),
  };

  const fetchRolesSpy = jest.spyOn(RoleActions, 'fetchRoles');
  const getPrincipalAccessSpy = jest.spyOn(AccessActions, 'getPrincipalAccess');
  fetchRolesSpy.mockImplementation(() => rolesMock);
  getPrincipalAccessSpy.mockImplementation(() => userAccessMock);

  const mockStore = configureStore();
  const store = mockStore({
    accessReducer: {
      access: { data: [], meta: {} },
    },
    roleReducer: {
      roles: {
        data: [],
        meta: {},
      },
    },
  });
  it('should render MUARolesTable for orgAdmins', () => {
    const wrapper = mount(
      <ComponentWrapper store={store} isOrgAdmin>
        <CommonBundleView apps={[]} />
      </ComponentWrapper>
    );
    expect(wrapper.find(MUARolesTable)).toHaveLength(1);
    expect(wrapper.find(MUAAccessTable)).toHaveLength(0);
  });

  it('should render MUAAccessTable for orgAdmins', () => {
    const wrapper = mount(
      <ComponentWrapper store={store} isOrgAdmin={false}>
        <CommonBundleView apps={[]} />
      </ComponentWrapper>
    );
    expect(wrapper.find(MUARolesTable)).toHaveLength(0);
    expect(wrapper.find(MUAAccessTable)).toHaveLength(1);
  });

  it('handleSetFilters should update filters config', () => {
    const initialFilters = createFilter({ name: '', isOrgAdmin: true, apps: [] });
    const expectedFilters = [
      { items: [], key: 'application', placeholder: 'Filter by application', type: 'checkbox', value: ['foo'] },
      { key: 'name', type: 'text', value: 'foo', label: 'Role name', placeholder: 'Filter by role name' },
      // { key: 'permission', value: '', placeholder: 'Filter by permission', type: 'text' },
    ];
    const wrapper = mount(
      <ComponentWrapper store={store} isOrgAdmin>
        <CommonBundleView apps={[]} />
      </ComponentWrapper>
    );
    expect(wrapper.find(MUARolesTable).prop('filters')).toEqual(initialFilters);

    act(() => {
      wrapper.find(MUARolesTable).prop('setFilters')({ name: 'foo' });
    });

    act(() => {
      wrapper.find(MUARolesTable).prop('setFilters')({ application: ['foo'] });
    });
    wrapper.update();

    expect(wrapper.find(MUARolesTable).prop('filters')).toEqual(expectedFilters);
  });

  it('createFilter should create correct filters structure for org admins', () => {
    const expectedStructure = [
      {
        key: 'application',
        value: [],
        placeholder: 'Filter by application',
        type: 'checkbox',
        items: [],
      },
      {
        key: 'name',
        type: 'text',
        value: name,
        label: 'Role name',
        placeholder: 'Filter by role name',
      },
      // {
      //   key: 'permission',
      //   value: '',
      //   placeholder: 'Filter by permission',
      //   type: 'text',
      // },
    ];
    const result = createFilter({ isOrgAdmin: true, apps: [] });
    expect(result).toEqual(expectedStructure);
  });

  it('createFilter should create correct filters structure non for org admins', () => {
    const expectedStructure = [
      {
        key: 'application',
        value: [],
        placeholder: 'Filter by application',
        type: 'checkbox',
        items: [{ label: 'foo', value: 'foo' }],
      },
    ];
    const result = createFilter({ isOrgAdmin: false, apps: ['foo'] });
    expect(result).toEqual(expectedStructure);
  });
});
