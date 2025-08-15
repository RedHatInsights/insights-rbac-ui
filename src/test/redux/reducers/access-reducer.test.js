import accessReducer, { accessInitialState } from '../../../redux/reducers/access-reducer';
import { callReducer } from '../redux-helpers';

import { GET_PRINCIPAL_ACCESS } from '../../../redux/action-types';

describe('Group reducer', () => {
  let initialState;
  const reducer = callReducer(accessReducer);

  beforeEach(() => {
    initialState = accessInitialState;
  });

  it('should set loading state', () => {
    const expectedState = { ...initialState, isLoading: true };
    expect(reducer(initialState, { type: `${GET_PRINCIPAL_ACCESS}_PENDING` })).toEqual(expectedState);
  });

  it('should set loading state', () => {
    const payload = { data: 'Foo' };
    const expectedState = { ...initialState, access: payload, isLoading: false };
    expect(reducer(initialState, { type: `${GET_PRINCIPAL_ACCESS}_FULFILLED`, payload })).toEqual(expectedState);
  });
});
