import debouncePromise from '@redhat-cloud-services/frontend-components-utilities/files/debounce';

export const scrollToTop = () => document.getElementById('root').scrollTo({
  behavior: 'smooth',
  top: 0,
  left: 0
});

export const getCurrentPage = (limit = 1, offset = 0) => Math.floor(offset / limit) + 1;

export const getNewPage = (page = 1, offset) => (page - 1) * offset;

export const mappedProps = (apiProps) => Object.entries(apiProps).reduce((acc, [ key, value ]) => ({
  ...acc,
  ...value && { [key]: value }
}), {});

export const debouncedFetch = debouncePromise(callback => callback());

export const calculateChecked = (rows = [], selected) => {
  return (rows.length !== 0 && rows.every(({ uuid }) => selected.find(row => row.uuid === uuid))) || (
    (rows.length !== 0 && rows.some(({ uuid }) => selected.find(row => row.uuid === uuid))) ? null : false
  );
};

export const selectedRows = (newSelection, isSelected) => (selected) => {
  if (!isSelected) {
    return selected.filter((row) => !newSelection.find(({ uuid }) => uuid === row.uuid));
  }

  return [
    ...selected,
    ...newSelection
  ].filter((row, key, arr) => arr.findIndex(({ uuid }) => row.uuid === uuid) === key);
};
