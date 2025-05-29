export const BAD_UUID = 'bad uuid';

import debouncePromise from '@redhat-cloud-services/frontend-components-utilities/debounce';
import { calculatePage } from './pagination';

export const trimAll = (string) => string.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();

export const scrollToTop = () =>
  document.getElementById('root').scrollTo({
    behavior: 'smooth',
    top: 0,
    left: 0,
  });

export const mappedProps = (apiProps) =>
  Object.entries(apiProps).reduce(
    (acc, [key, value]) => ({
      ...acc,
      ...(value && { [key]: value }),
    }),
    {},
  );

export const debouncedFetch = debouncePromise((callback) => callback());

export const calculateChecked = (rows = [], selected, isRowSelectable = () => true) => {
  const nonDefaults = rows.filter(isRowSelectable);
  return (
    (nonDefaults.length !== 0 && nonDefaults.every(({ uuid }) => selected.find((row) => row.uuid === uuid))) || (selected.length > 0 ? null : false)
  );
};

export const selectedRows = (newSelection, isSelected) => (selected) => {
  if (!isSelected) {
    return selected.filter((row) => !newSelection.find(({ uuid }) => uuid === row.uuid));
  }

  return [...selected, ...newSelection].filter((row, key, arr) => arr.findIndex(({ uuid }) => row.uuid === uuid) === key);
};

export const firstUpperCase = (text) => text.charAt(0).toUpperCase() + text.slice(1);

export const createQueryParams = (params) => {
  const searchParams = new URLSearchParams();
  Object.keys(params).forEach((key) => {
    const value = params[key];

    if (Array.isArray(value)) {
      value.forEach((item) => item && searchParams.append(key, item));
    } else {
      value && searchParams.set(key, value);
    }
  });
  return searchParams.toString();
};

export const removeQueryParams = (location, navigate) => {
  navigate(
    {
      pathname: location.pathname,
      search: '',
    },
    {
      replace: true,
    },
  );
};

export const getBackRoute = (pathname, pagination, filters) => ({
  pathname,
  search: createQueryParams({
    per_page: pagination.limit,
    page: calculatePage(pagination.limit, pagination.offset),
    ...filters,
  }),
});

export const getDateFormat = (date) => {
  const monthAgo = new Date(Date.now());
  return Date.parse(date) < monthAgo.setMonth(monthAgo.getMonth() - 1) ? 'onlyDate' : 'relative';
};

export const isExternalIdp = (token = '') => {
  let roles = [''];
  let tokenArray = token.split('.');
  if (tokenArray.length > 1) {
    let token1 = window.atob(tokenArray[1]);
    if (token1) {
      roles = JSON.parse(token1)?.realm_access?.roles;
      if (roles.includes('external-idp')) {
        return true;
      }
    }
  }

  return false;
};
