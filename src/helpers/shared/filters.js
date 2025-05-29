export const syncDefaultFiltersWithUrl = (location, navigate, keys, defaults = {}) => {
  const searchParams = new URLSearchParams(location.search);

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

  navigate(
    {
      pathname: location.pathname,
      search: searchParams.toString(),
    },
    {
      replace: true,
    },
  );
  return filters;
};

export const areFiltersPresentInUrl = (location, keys) => {
  const searchParams = new URLSearchParams(location.search);
  return keys.some((key) => searchParams.get(key));
};

export const applyFiltersToUrl = (location, navigate, newValues) => {
  const searchParams = new URLSearchParams(location.search);
  Object.keys(newValues).forEach((key) => searchParams.delete(key));

  Object.keys(newValues).forEach((key) => {
    const value = newValues[key];

    if (Array.isArray(value)) {
      value.forEach((item) => item && searchParams.append(key, item));
    } else {
      value && searchParams.set(key, value);
    }
  });

  navigate(
    {
      pathname: location.pathname,
      search: searchParams.toString(),
    },
    {
      replace: true,
    },
  );
};
