import { getAxiosInstance } from '../../helpers/shared/user-login';
import MockAdapter from 'axios-mock-adapter';

export const mock = new MockAdapter(getAxiosInstance());
