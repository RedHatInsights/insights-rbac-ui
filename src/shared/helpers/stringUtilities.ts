import { subMonths } from 'date-fns';

export const firstUpperCase = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

export const getDateFormat = (date: string): 'onlyDate' | 'relative' => {
  const threeMonthsAgo = subMonths(new Date(), 3);
  return Date.parse(date) < threeMonthsAgo.getTime() ? 'onlyDate' : 'relative';
};

// This function is used to trim all leading and trailing spaces in a string and
// replace multiple spaces with a single space.
export const trimAll = (string: string): string => string.replace(/\s+/g, ' ').trim();
