import { Location, NavigateFunction } from 'react-router-dom';

// Type for URL filter values - what can be in URL search params
type FilterValue = string | string[] | number | boolean | undefined;

export const syncDefaultFiltersWithUrl = <T>(
  location: Location,
  navigate: NavigateFunction,
  keys: string[],
  defaults: T = {} as T,
): Record<string, FilterValue> => {
  const searchParams = new URLSearchParams(location.search);

  const filters: Record<string, FilterValue> = keys.reduce(
    (acc, key) => {
      const values = searchParams.getAll(key);
      acc[key] = values.length > 1 ? values : values[0];
      return acc;
    },
    {} as Record<string, FilterValue>,
  );

  Object.keys(defaults as Record<string, unknown>).forEach((key) => {
    const value = (defaults as Record<string, unknown>)[key];
    if (value !== undefined && value !== null) {
      if (Array.isArray(filters[key])) {
        const existingValues = filters[key] as string[];
        const newValues = Array.isArray(value) ? (value as string[]) : [String(value)];
        filters[key] = [...new Set([...existingValues, ...newValues])];
      } else {
        filters[key] = (String(value).length > 0 && (value as FilterValue)) || filters[key];
      }

      if (Array.isArray(value)) {
        (value as string[]).forEach((item: string) => searchParams.getAll(key).includes(item) || searchParams.append(key, item));
      } else {
        searchParams.get(key) || searchParams.set(key, String(value));
      }
    }
  });

  navigate(
    {
      pathname: location.pathname,
      search: searchParams.toString(),
    },
    { replace: true },
  );
  return filters;
};

export const areFiltersPresentInUrl = (location: Location, keys: string[]): boolean => {
  const searchParams = new URLSearchParams(location.search);
  return keys.some((key) => searchParams.get(key));
};

export const applyFiltersToUrl = <T>(location: Location, navigate: NavigateFunction, newValues: T): void => {
  const searchParams = new URLSearchParams(location.search);
  Object.keys(newValues as Record<string, unknown>).forEach((key) => searchParams.delete(key));

  Object.keys(newValues as Record<string, unknown>).forEach((key) => {
    const value = (newValues as Record<string, unknown>)[key];

    if (Array.isArray(value)) {
      (value as string[]).forEach((item: string) => item && searchParams.append(key, item));
    } else if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
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
