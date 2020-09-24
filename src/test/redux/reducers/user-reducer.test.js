import userReducer, { userInitialState } from '../../../redux/reducers/user-reducer';
import { callReducer } from '../redux-helpers';

import { FETCH_USERS } from '../../../redux/action-types';

describe('User reducer', () => {
  let initialState;
  const reducer = callReducer(userReducer);

  beforeEach(() => {
    initialState = userInitialState;
  });

  it('should set loading state', () => {
    const expectedState = { ...initialState, isUserDataLoading: true };
    expect(reducer(initialState, { type: `${FETCH_USERS}_PENDING` })).toEqual(expectedState);
  });

  it('should set user data and loading state to false', () => {
    const payload = { data: 'Foo' };
    const expectedState = { ...initialState, users: payload, isUserDataLoading: false };
    expect(reducer(initialState, { type: `${FETCH_USERS}_FULFILLED`, payload })).toEqual(expectedState);
  });
});
