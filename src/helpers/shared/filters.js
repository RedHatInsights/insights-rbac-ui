export const syncDefaultFiltersWithUrl = (history, keys, defaults = {}) => {
  const searchParams = new URLSearchParams(history.location.search);

  let filters = keys.reduce((acc, key) => {
    const values = searchParams.getAll(key);
    return {
      ...acc,
      [key]: values.length > 1 ? values : values[0],
    };
  }, {});

  Object.keys(defaults).forEach((key) => {
    const value = defaults[key];
    filters = {
      ...filters,
      [key]: Array.isArray(filters[key])
        ? [...new Set([...filters[key], ...(Array.isArray(value) ? value : [value])])]
        : (value?.length > 0 && value) || filters[key],
    };

    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.getAll(key).includes(item) || searchParams.append(key, item));
    } else {
      searchParams.get(key) || (value && searchParams.set(key, value));
    }
  });

  history.replace({
    pathname: history.location.pathname,
    search: searchParams.toString(),
  });
  return filters;
};

export const applyFiltersToUrl = (history, newValues) => {
  const searchParams = new URLSearchParams(history.location.search);
  Object.keys(newValues).forEach((key) => searchParams.delete(key));

  Object.keys(newValues).forEach((key) => {
    const value = newValues[key];

    if (Array.isArray(value)) {
      value.forEach((item) => item && searchParams.append(key, item));
    } else {
      value && searchParams.set(key, value);
    }
  });

  history.replace({
    pathname: history.location.pathname,
    search: searchParams.toString(),
  });
};
