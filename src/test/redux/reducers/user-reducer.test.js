import userReducer, { usersInitialState } from '../../../redux/users/reducer';
import { callReducer } from '../redux-helpers';

import { FETCH_USERS } from '../../../redux/users/action-types';

describe('User reducer', () => {
  let initialState;
  const reducer = callReducer(userReducer);

  beforeEach(() => {
    initialState = usersInitialState;
  });

  it('should set loading state', () => {
    const expectedState = { ...initialState, isUserDataLoading: true };
    expect(reducer(initialState, { type: `${FETCH_USERS}_PENDING` })).toEqual(expectedState);
  });

  it('should set user data and loading state to false', () => {
    const payload = { data: 'Foo' };
    const expectedState = {
      ...initialState,
      users: { filters: initialState.users.filters, pagination: initialState.users.pagination, ...payload },
      isUserDataLoading: false,
    };
    expect(reducer(initialState, { type: `${FETCH_USERS}_FULFILLED`, payload })).toEqual(expectedState);
  });
});
