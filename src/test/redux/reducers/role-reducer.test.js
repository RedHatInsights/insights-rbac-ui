import roleReducer, { rolesInitialState } from '../../../redux/reducers/role-reducer';
import { callReducer } from '../redux-helpers';

import { FETCH_ROLE, FETCH_ROLES, FETCH_ROLES_FOR_WIZARD, FETCH_ROLE_FOR_USER } from '../../../redux/action-types';

describe('Role reducer', () => {
  let initialState;
  const reducer = callReducer(roleReducer);

  beforeEach(() => {
    initialState = rolesInitialState;
  });

  it('should set loading state', () => {
    const expectedState = { ...initialState, isLoading: true };
    expect(reducer(initialState, { type: `${FETCH_ROLES}_PENDING` })).toEqual(expectedState);
  });

  it('should set roles data and set loading state to false', () => {
    const payload = {
      ...initialState.roles,
      data: 'Foo',
    };
    const expectedState = { ...initialState, isLoading: false, roles: payload };
    expect(reducer(initialState, { type: `${FETCH_ROLES}_FULFILLED`, payload })).toEqual(expectedState);
  });

  it('should set loading state when loading single role', () => {
    const expectedState = { ...initialState, isRecordLoading: true };
    expect(reducer(initialState, { type: `${FETCH_ROLE}_PENDING` })).toEqual(expectedState);
  });

  it('should set role data and set loading state to false', () => {
    const payload = { data: 'Foo' };
    const expectedState = { ...initialState, isRecordLoading: false, selectedRole: payload };
    expect(reducer(initialState, { type: `${FETCH_ROLE}_FULFILLED`, payload })).toEqual(expectedState);
  });

  it('should set loading state when loading role for user', () => {
    const expectedState = { ...initialState, isRecordLoading: true };
    expect(reducer(initialState, { type: `${FETCH_ROLE_FOR_USER}_PENDING` })).toEqual(expectedState);
  });

  it('should set role data for uuid1 and loading loading state to false', () => {
    const payload = { data: 'Foo', uuid: 'uuid1' };
    const expectedState = { ...initialState, isRecordLoading: false, rolesWithAccess: { uuid1: payload } };
    expect(reducer(initialState, { type: `${FETCH_ROLE_FOR_USER}_FULFILLED`, payload })).toEqual(expectedState);
  });

  it('should set loading state when loading role for user', () => {
    const expectedState = { ...initialState, isWizardLoading: true };
    expect(reducer(initialState, { type: `${FETCH_ROLES_FOR_WIZARD}_PENDING` })).toEqual(expectedState);
  });

  it('should set role data for uuid1 and loading loading state to false', () => {
    const payload = { data: 'Foo' };
    const expectedState = { ...initialState, isWizardLoading: false, rolesForWizard: payload };
    expect(reducer(initialState, { type: `${FETCH_ROLES_FOR_WIZARD}_FULFILLED`, payload })).toEqual(expectedState);
  });
});
