import React from 'react';
import { act } from 'react-dom/test-utils';
import { fireEvent, render, screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import CommonBundleView, { createFilter } from '../../../smart-components/myUserAccess/CommonBundleView';
import OrgAdminContext from '../../../utilities/org-admin-context';

import * as RoleActions from '../../../redux/actions/role-actions';
import * as AccessActions from '../../../redux/actions/access-actions';
import { FETCH_ROLES, GET_PRINCIPAL_ACCESS } from '../../../redux/action-types';
import PropTypes from 'prop-types';

// TODO: Add permissions back when we support partial matching

const ComponentWrapper = ({ store, isOrgAdmin, children }) => (
  <MemoryRouter>
    <Provider store={store}>
      <OrgAdminContext.Provider value={isOrgAdmin}>{children}</OrgAdminContext.Provider>
    </Provider>
  </MemoryRouter>
);
ComponentWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  store: PropTypes.object.isRequired,
  isOrgAdmin: PropTypes.arrayOf(PropTypes.bool),
};

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
    const { container } = render(
      <ComponentWrapper store={store} isOrgAdmin>
        <CommonBundleView apps={[]} />
      </ComponentWrapper>,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render MUAAccessTable for orgAdmins', () => {
    const { container } = render(
      <ComponentWrapper store={store} isOrgAdmin={false}>
        <CommonBundleView apps={[]} />
      </ComponentWrapper>,
    );
    expect(container).toMatchSnapshot();
  });

  it('handleSetFilters should update filters config', async () => {
    let container;
    await act(async () => {
      const { container: ci } = render(
        <ComponentWrapper store={store} isOrgAdmin>
          <CommonBundleView apps={[]} />
        </ComponentWrapper>,
      );

      container = ci;
    });

    await act(async () => {
      await fireEvent.click(screen.getByText('Application'));
    });

    await act(async () => {
      await fireEvent.click(screen.getByText('Role name'));
    });

    await act(async () => {
      await fireEvent.change(screen.getByLabelText('text input'), { target: { value: 'foo' } });
    });

    expect(container.querySelector('.ins-c-chip-filters')).toMatchSnapshot();
  });

  it('createFilter should create correct filters structure for org admins', () => {
    const expectedStructure = [
      {
        key: 'application',
        value: [],
        placeholder: 'Filter by {key}',
        type: 'checkbox',
        items: [],
      },
      {
        key: 'name',
        type: 'text',
        value: name,
        label: 'Role name',
        placeholder: 'Filter by {key}',
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
        placeholder: 'Filter by {key}',
        type: 'checkbox',
        items: [{ label: 'foo', value: 'foo' }],
      },
    ];
    const result = createFilter({ isOrgAdmin: false, apps: ['foo'] });
    expect(result).toEqual(expectedStructure);
  });
});
