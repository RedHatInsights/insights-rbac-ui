import { API_ERROR } from '../action-types';

const setErrorState = (_, { payload }) => ({
  errorCode: payload,
});

export default {
  [API_ERROR]: setErrorState,
};
