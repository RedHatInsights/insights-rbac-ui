import roleReducer from '../../../redux/reducers/role-reducer';
import { callReducer } from '../redux-helpers';

import {
  FETCH_ROLES
} from '../../../redux/action-types';

describe('Role reducer', () => {
  let initialState;
  const reducer = callReducer(roleReducer);

  beforeEach(() => {
    initialState = {};
  });

  it('should set loading state', () => {
    const expectedState = { isLoading: true };
    expect(reducer(initialState, { type: `${FETCH_ROLES}_PENDING` })).toEqual(expectedState);
  });

  it('should set groups data and set loading state to false', () => {
    const payload = { data: 'Foo' };
    const expectedState = { isLoading: false, roles: payload };
    expect(reducer(initialState, { type: `${FETCH_ROLES}_FULFILLED`, payload })).toEqual(expectedState);
  });

});
