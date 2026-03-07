import { useLocation } from 'react-router-dom';

type SearchParamsResult<T extends readonly string[]> = {
  [K in T[number]]: string | null;
};

/**
 * Return an object of requested search params
 * @param queries names of query parameters to be extracted from URL search params
 */
const useSearchParams = <T extends readonly string[]>(...queries: T): SearchParamsResult<T> => {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  return queries.reduce((acc, query) => ({ ...acc, [query]: params.get(query) }), {} as SearchParamsResult<T>);
};

export default useSearchParams;
