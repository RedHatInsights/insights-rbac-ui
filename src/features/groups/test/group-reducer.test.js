import groupReducer, { groupsInitialState } from '../../../redux/groups/reducer';
import { callReducer } from '../../../test/redux/redux-helpers';

import {
  FETCH_ADD_ROLES_FOR_GROUP,
  FETCH_GROUP,
  FETCH_GROUPS,
  FETCH_MEMBERS_FOR_GROUP,
  FETCH_ROLES_FOR_GROUP,
} from '../../../redux/groups/action-types';

describe('Group reducer', () => {
  let initialState;
  const reducer = callReducer(groupReducer);

  beforeEach(() => {
    initialState = groupsInitialState;
  });

  it('should set loading state', () => {
    const expectedState = { ...initialState, isLoading: true };
    expect(reducer(initialState, { type: `${FETCH_GROUPS}_PENDING` })).toEqual(expectedState);
  });

  it('should set groups data and set loading state to false', () => {
    const payload = { data: 'Foo' };
    const expectedState = {
      ...initialState,
      isLoading: false,
      groups: { filters: initialState.groups.filters, pagination: initialState.groups.pagination, ...payload },
    };
    expect(reducer(initialState, { type: `${FETCH_GROUPS}_FULFILLED`, payload })).toEqual(expectedState);
  });

  it('should set loading state for single group', () => {
    const expectedState = { ...initialState, isRecordLoading: true, selectedGroup: { ...initialState.selectedGroup, loaded: false } };
    expect(reducer(initialState, { type: `${FETCH_GROUP}_PENDING` })).toEqual(expectedState);
  });

  it('should set selectedGroup data and set loading state to false', () => {
    const payload = { principals: ['Foo'], roles: ['bar'], roleCount: 1, uuid: 'uuid1' };
    const expectedState = {
      ...initialState,
      isRecordLoading: false,
      groups: { ...initialState.groups },
      selectedGroup: {
        ...initialState.selectedGroup,
        members: { ...initialState.selectedGroup.members, data: payload.principals },
        pagination: { ...initialState.selectedGroup.pagination, count: 1 },
        uuid: 'uuid1',
        roleCount: 1,
        loaded: true,
      },
    };
    expect(reducer(initialState, { type: `${FETCH_GROUP}_FULFILLED`, payload })).toEqual(expectedState);
  });

  it('should set selectedGroup data and set loading state to false', () => {
    const payload = { principals: ['Foo'], roles: ['bar'], roleCount: 1, uuid: 'uuid1' };
    const initialStateWithGroupsLoaded = {
      ...initialState,
      groups: {
        ...initialState.groups,
        data: [
          { roleCount: 10, uuid: 'uuid1', principals: ['NOT-Foo'], roles: ['NOT-bar'] },
          { roleCount: 5, uuid: 'uuid2' },
          { roleCount: 2, uuid: 'uuid3' },
        ],
      },
    };
    const expectedState = {
      ...initialState,
      isRecordLoading: false,
      groups: {
        ...initialState.groups,
        data: [
          { roleCount: 1, uuid: 'uuid1', principals: ['Foo'], roles: ['bar'], loaded: true },
          { roleCount: 5, uuid: 'uuid2' },
          { roleCount: 2, uuid: 'uuid3' },
        ],
      },
      selectedGroup: {
        ...initialState.selectedGroup,
        members: { ...initialState.selectedGroup.members, data: payload.principals },
        pagination: { ...initialState.selectedGroup.pagination, count: 1 },
        uuid: 'uuid1',
        roleCount: 1,
        loaded: true,
      },
    };
    expect(reducer(initialStateWithGroupsLoaded, { type: `${FETCH_GROUP}_FULFILLED`, payload })).toEqual(expectedState);
  });

  it('should set loading state for roles in group', () => {
    const expectedState = { ...initialState, selectedGroup: { ...initialState.selectedGroup, error: undefined, roles: { isLoading: true } } };
    expect(reducer(initialState, { type: `${FETCH_ROLES_FOR_GROUP}_PENDING` })).toEqual(expectedState);
  });

  it('should set roles for selected group and loading state to false', () => {
    const payload = { data: ['bar'], meta: { count: 1 } };
    const expectedState = {
      ...initialState,
      selectedGroup: { ...initialState.selectedGroup, roles: { isLoading: false, ...payload } },
    };
    expect(reducer(initialState, { type: `${FETCH_ROLES_FOR_GROUP}_FULFILLED`, payload })).toEqual(expectedState);
  });

  it('should set loading state for members in group', () => {
    const expectedState = { ...initialState, selectedGroup: { ...initialState.selectedGroup, members: { isLoading: true } } };
    expect(reducer(initialState, { type: `${FETCH_MEMBERS_FOR_GROUP}_PENDING` })).toEqual(expectedState);
  });
  it('should set members for selected group and loading state to false', () => {
    const payload = { data: ['bar'], meta: { count: 1 } };
    const expectedState = {
      ...initialState,
      selectedGroup: { ...initialState.selectedGroup, members: { isLoading: false, ...payload } },
    };
    expect(reducer(initialState, { type: `${FETCH_MEMBERS_FOR_GROUP}_FULFILLED`, payload })).toEqual(expectedState);
  });

  it('should set loading state for addRoles', () => {
    const expectedState = {
      ...initialState,
      selectedGroup: { ...initialState.selectedGroup, addRoles: { loaded: false } },
    };
    expect(reducer(initialState, { type: `${FETCH_ADD_ROLES_FOR_GROUP}_PENDING` })).toEqual(expectedState);
  });

  it('should set addRoles for selected group', () => {
    const payload = { data: ['bar'], meta: { count: 1 } };
    const expectedState = {
      ...initialState,
      selectedGroup: {
        ...initialState.selectedGroup,
        addRoles: { roles: payload.data, pagination: payload.meta, loaded: true },
      },
    };
    expect(reducer(initialState, { type: `${FETCH_ADD_ROLES_FOR_GROUP}_FULFILLED`, payload })).toEqual(expectedState);
  });
});
