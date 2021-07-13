import policyReducer, { policiesInitialState } from '../../../redux/reducers/policy-reducer';
import { callReducer } from '../redux-helpers';

import { FETCH_GROUP_POLICIES, FETCH_POLICY } from '../../../redux/action-types';

describe('Policy reducer', () => {
  let initialState;
  const reducer = callReducer(policyReducer);

  beforeEach(() => {
    initialState = policiesInitialState;
  });

  it('should set loading state', () => {
    const expectedState = { ...policiesInitialState, isLoading: true };
    expect(reducer(initialState, { type: `${FETCH_GROUP_POLICIES}_PENDING` })).toEqual(expectedState);
  });

  it('should set groups data and set loading state to false', () => {
    const payload = { data: 'Foo' };
    const expectedState = { ...policiesInitialState, isLoading: false, policies: payload };
    expect(reducer(initialState, { type: `${FETCH_GROUP_POLICIES}_FULFILLED`, payload })).toEqual(expectedState);
  });

  it('should set loading state', () => {
    const expectedState = { ...policiesInitialState, isRecordLoading: true };
    expect(reducer(initialState, { type: `${FETCH_POLICY}_PENDING` })).toEqual(expectedState);
  });

  it('should set groups data and set loading state to false', () => {
    const payload = { data: 'Foo' };
    const expectedState = { ...policiesInitialState, isLoading: false, selectedPolicy: payload };
    expect(reducer(initialState, { type: `${FETCH_POLICY}_FULFILLED`, payload })).toEqual(expectedState);
  });
});
