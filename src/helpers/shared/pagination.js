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

export const syncDefaultPaginationWithUrl = (history, defaultPagination = defaultSettings) => {
  const searchParams = new URLSearchParams(history.location.search);

  isNaN(parseInt(searchParams.get('per_page'))) && searchParams.set('per_page', defaultPagination.limit);
  const limit = parseInt(searchParams.get('per_page'));
  isNaN(parseInt(searchParams.get('page'))) && searchParams.set('page', 1);
  const offset = calculateOffset(parseInt(searchParams.get('page')), limit);

  history.replace({
    pathname: history.location.pathname,
    search: searchParams.toString(),
  });
  return { ...defaultPagination, limit, offset };
};

export const isOffsetValid = (offset, count) => offset === 0 || count > offset;

export const getLastPageOffset = (count, limit) => count - (count % limit);

export const applyPaginationToUrl = (history, limit, offset = 0) => {
  const searchParams = new URLSearchParams(history.location.search);
  searchParams.set('per_page', limit);
  searchParams.set('page', calculatePage(limit, offset));

  history.replace({
    pathname: history.location.pathname,
    search: searchParams.toString(),
  });
};
