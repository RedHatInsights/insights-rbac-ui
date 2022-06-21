export const defaultSettings = {
  limit: 20,
  offset: 0,
  itemCount: 0,
};

export const defaultCompactSettings = {
  limit: 10,
  offset: 0,
  itemCount: 0,
};

export const calculatePage = (limit = defaultSettings.limit, offset = 0) => Math.floor(offset / limit) + 1;

export const calculateOffset = (page = 1, limit = defaultSettings.limit) => (page - 1) * limit;

export const syncDefaultPaginationWithUrl = (location, navigate, defaultPagination = defaultSettings) => {
  let searchParams = new URLSearchParams(location.search);

  let limit = parseInt(searchParams.get('per_page'));
  let page = parseInt(searchParams.get('page'));

  if (isNaN(limit) || limit <= 0) {
    limit = defaultPagination.limit;
    searchParams.set('per_page', limit);
  }
  if (isNaN(page) || page <= 0) {
    page = 1;
    searchParams.set('page', page);
  }

  const offset = calculateOffset(page, limit);

  navigate(
    {
      pathname: location.pathname,
      search: searchParams.toString(),
    },
    { replace: true }
  );
  return { ...defaultPagination, limit, offset };
};

export const isPaginationPresentInUrl = (location) => {
  const searchParams = new URLSearchParams(location.search);
  return searchParams.get('per_page') && searchParams.get('per_page');
};

export const isOffsetValid = (offset = 0, count = 0) => offset === 0 || count > offset;

export const getLastPageOffset = (count, limit) => count - (count % limit);

export const applyPaginationToUrl = (location, navigate, limit, offset = 0) => {
  const searchParams = new URLSearchParams(location.search);
  searchParams.set('per_page', limit);
  searchParams.set('page', calculatePage(limit, offset));

  navigate(
    {
      pathname: location.pathname,
      search: searchParams.toString(),
    },
    {
      replace: true,
    }
  );
};
