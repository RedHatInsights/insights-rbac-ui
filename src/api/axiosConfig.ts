import axios, { AxiosError } from 'axios';
import { API_ERROR } from '../redux/api-error/action-types';
import registry from '../utilities/store';

const interceptor403 = (error: AxiosError) => {
  const store = registry.getStore();

  if (error.response && error.response.status === 403) {
    store.dispatch({ type: API_ERROR, payload: 403 });
  }

  throw error;
};

const interceptor401 = (error: AxiosError) => {
  if (error.response && error.response.status === 401) {
    window.location.reload();
  }

  throw error;
};

const interceptor500 = (error: AxiosError) => {
  const store = registry.getStore();

  if (error.response && error.response.status >= 500) {
    store.dispatch({ type: API_ERROR, payload: 500 });
  }

  throw error;
};

const authInterceptor = (config: any) => config;

const responseDataInterceptor = (response: any) => response.data || response;

const errorInterceptor = (error: AxiosError) => {
  throw error;
};

export const axiosInstance = axios.create();
axiosInstance.interceptors.request.use(authInterceptor);
axiosInstance.interceptors.response.use(responseDataInterceptor);

axiosInstance.interceptors.response.use(null, interceptor401);
axiosInstance.interceptors.response.use(null, interceptor403);
axiosInstance.interceptors.response.use(null, interceptor500);
axiosInstance.interceptors.response.use(null, errorInterceptor);
