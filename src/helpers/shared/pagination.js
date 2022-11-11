export const defaultSettings = {
  limit: 20,
  offset: 0,
  itemCount: 0,
};

export const defaultAdminSettings = {
  ...defaultSettings,
  limit: 50,
};

export const defaultCompactSettings = {
  ...defaultSettings,
  limit: 10,
};

export const calculatePage = (limit = defaultSettings.limit, offset = 0) => Math.floor(offset / limit) + 1;

export const calculateOffset = (page = 1, limit = defaultSettings.limit) => (page - 1) * limit;

export const syncDefaultPaginationWithUrl = (history, defaultPagination = defaultSettings) => {
  let searchParams = new URLSearchParams(history.location.search);

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

  history.replace({
    pathname: history.location.pathname,
    search: searchParams.toString(),
  });
  return { ...defaultPagination, limit, offset };
};

export const isPaginationPresentInUrl = (history) => {
  const searchParams = new URLSearchParams(history.location.search);
  return searchParams.get('per_page') && searchParams.get('per_page');
};

export const isOffsetValid = (offset = 0, count = 0) => offset === 0 || count > offset;

export const getLastPageOffset = (count, limit) => Math.floor((count % limit === 0 ? count - 1 : count) / limit) * limit;

export const applyPaginationToUrl = (history, limit, offset = 0) => {
  const searchParams = new URLSearchParams(history.location.search);
  searchParams.set('per_page', limit);
  searchParams.set('page', calculatePage(limit, offset));

  history.replace({
    pathname: history.location.pathname,
    search: searchParams.toString(),
  });
};
