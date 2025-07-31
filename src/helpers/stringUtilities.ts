export const firstUpperCase = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

export const getDateFormat = (date: string): 'onlyDate' | 'relative' => {
  const monthAgo = new Date(Date.now());
  return Date.parse(date) < monthAgo.setMonth(monthAgo.getMonth() - 1) ? 'onlyDate' : 'relative';
};

export const trimAll = (string: string): string => string.replace(/[-EFF]/g, '').trim();
