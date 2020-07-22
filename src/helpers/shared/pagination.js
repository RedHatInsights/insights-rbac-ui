export const defaultSettings = {
  limit: 20,
  offset: 0,
  itemCount: 0
};

export const defaultCompactSettings = {
  limit: 10,
  offset: 0,
  itemCount: 0
};

export const getCurrentPage = (limit = 1, offset = 0) => Math.floor(offset / limit) + 1;

export const getNewPage = (page = 1, offset) => (page - 1) * offset;
