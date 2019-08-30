export const defaultSettings = {
  limit: 50,
  offset: 0,
  itemCount: 1,
  numberOfItems: 50
};

export const getCurrentPage = (limit = 1, offset = 0) => Math.floor(offset / limit) + 1;

export const getNewPage = (page = 1, offset) => (page - 1) * offset;
