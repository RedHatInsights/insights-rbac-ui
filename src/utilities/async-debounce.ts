import awesomeDebouncePromise from 'awesome-debounce-promise';

const customDebouncePromise: typeof awesomeDebouncePromise = (asyncFunction, debounceTime = 250, options = { onlyResolvesLast: false }) =>
  awesomeDebouncePromise(asyncFunction, debounceTime, options);

export default customDebouncePromise;
