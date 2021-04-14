export const getFiltersFromUrl = (history, keys, defaultValues = {}) => {
  const searchParams = new URLSearchParams(history.location.search);

  let filters = keys.reduce((acc, key) => {
    const values = searchParams.getAll(key);
    return {
      ...acc,
      [key]: values.length > 1 ? values : values[0],
    };
  }, {});

  Object.keys(defaultValues).forEach((key) => {
    const value = defaultValues[key];
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

  history.replace(`${history.location.pathname}?${searchParams.toString()}`, {});
  return filters;
};

export const setFiltersToUrl = (history, newValues) => {
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

  history.replace(`${history.location.pathname}?${searchParams.toString()}`, {});
};
