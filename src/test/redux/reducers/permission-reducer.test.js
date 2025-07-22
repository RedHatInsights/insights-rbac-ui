import groupReducer from '../../../redux/permissions/reducer';
import { callReducer } from '../redux-helpers';

import { LIST_PERMISSIONS } from '../../../redux/permissions/action-types';

describe('Permission reducer', () => {
  let initialState;
  const reducer = callReducer(groupReducer);

  beforeEach(() => {
    initialState = {};
  });

  it('should set loading state', () => {
    const expectedState = { isLoading: true };
    expect(reducer(initialState, { type: `${LIST_PERMISSIONS}_PENDING` })).toEqual(expectedState);
  });

  it('should set groups data and set loading state to false', () => {
    const payload = { data: 'Foo' };
    const expectedState = { isLoading: false, permission: payload };
    expect(reducer(initialState, { type: `${LIST_PERMISSIONS}_FULFILLED`, payload })).toEqual(expectedState);
  });
});
