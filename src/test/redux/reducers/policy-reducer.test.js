import policyReducer from '../../../redux/reducers/policy-reducer';
import { callReducer } from '../redux-helpers';

import {
  FETCH_GROUP_POLICIES
} from '../../../redux/action-types';

describe('Policy reducer', () => {
  let initialState;
  const reducer = callReducer(policyReducer);

  beforeEach(() => {
    initialState = {};
  });

  it('should set loading state', () => {
    const expectedState = { isLoading: true };
    expect(reducer(initialState, { type: `${FETCH_GROUP_POLICIES}_PENDING` })).toEqual(expectedState);
  });

  it('should set groups data and set loading state to false', () => {
    const payload = { data: 'Foo' };
    const expectedState = { isLoading: false, policies: payload };
    expect(reducer(initialState, { type: `${FETCH_GROUP_POLICIES}_FULFILLED`, payload })).toEqual(expectedState);
  });

});
