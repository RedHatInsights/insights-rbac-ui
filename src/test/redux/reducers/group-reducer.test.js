import groupReducer from '../../../redux/reducers/group-reducer';
import { callReducer } from '../redux-helpers';

import {
  FETCH_GROUPS
} from '../../../redux/action-types';

describe('Group reducer', () => {
  let initialState;
  const reducer = callReducer(groupReducer);

  beforeEach(() => {
    initialState = {};
  });

  it('should set loading state', () => {
    const expectedState = { isLoading: true };
    expect(reducer(initialState, { type: `${FETCH_GROUPS}_PENDING` })).toEqual(expectedState);
  });

  it('should set groups data and set loading state to false', () => {
    const payload = { data: 'Foo' };
    const expectedState = { isLoading: false, groups: payload };
    expect(reducer(initialState, { type: `${FETCH_GROUPS}_FULFILLED`, payload })).toEqual(expectedState);
  });

});
