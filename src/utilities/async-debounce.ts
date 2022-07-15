import awesomeDebouncePromise from 'awesome-debounce-promise';

export default (asyncFunction: (...args: any[]) => Promise<any>, debounceTime = 250, options = { onlyResolvesLast: false }) =>
  awesomeDebouncePromise(asyncFunction, debounceTime, options);
