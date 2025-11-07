import { trimAll } from '../../../helpers/stringUtilities';

describe('stringUtilities.trimAll', () => {
  it('preserves non-whitespace characters like dashes and letters', () => {
    expect(trimAll('A-B-C-D-E-F-G')).toBe('A-B-C-D-E-F-G');
    expect(trimAll('EF-ef')).toBe('EF-ef');
  });

  it('trims leading/trailing whitespace and collapses internal spaces', () => {
    expect(trimAll('  Name   with   spaces  ')).toBe('Name with spaces');
    expect(trimAll('\t Multiple \n whitespace \t characters ')).toBe('Multiple whitespace characters');
  });
});
