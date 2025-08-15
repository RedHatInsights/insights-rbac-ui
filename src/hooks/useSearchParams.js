import { useLocation } from 'react-router-dom';

/**
 * Return an object of requests search params
 * @param  {...string} queries names of query paramaters to be extracted from URL search parmas
 */
const useSearchParams = (...queries) => {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  return queries.reduce((acc, query) => ({ ...acc, [query]: params.get(query) }), {});
};

export default useSearchParams;
