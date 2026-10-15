import { parse } from '@formatjs/icu-messageformat-parser';
import { describe, expect, it } from 'vitest';
import messageDescriptors from '../src/Messages';
import { pseudoLocalize } from './pseudo';

const enDefaults = Object.values(messageDescriptors).map((descriptor) => (descriptor as { defaultMessage: string }).defaultMessage);

function isParsable(message: string): boolean {
  try {
    parse(message);
    return true;
  } catch {
    return false;
  }
}

describe('pseudoLocalize', () => {
  it('transforms literal text', () => {
    expect(pseudoLocalize('Add')).toBe('[Åðð]');
  });

  it('preserves rich-text tag names', () => {
    // Tag names are structural ICU, not literal text: <b> must not become <ß>
    expect(pseudoLocalize('<b>{name}</b>')).toBe('[<b>{name}</b>]');
  });

  it('preserves arguments, selectors and # while transforming literals inside plural branches', () => {
    expect(pseudoLocalize('{count, plural, offset:1 one {# cat} other {# cats}}')).toBe('[{count, plural, offset:1 one {# çåţ} other {# çåţ§}}]');
  });

  it('preserves select selectors while transforming option literals', () => {
    expect(pseudoLocalize('{gender, select, male {he} female {she} other {they}}')).toBe('[{gender, select, male {ĥé} female {§ĥé} other {ţĥéý}}]');
  });

  it('preserves number/date/time styles', () => {
    expect(pseudoLocalize('{count, number, integer}')).toBe('[{count, number, integer}]');
    expect(pseudoLocalize('At {ts, date, long}')).toBe('[Åţ {ts, date, long}]');
  });

  it('preserves quoted-literal syntax characters as literals', () => {
    // A quoted '{name}' is literal display text, not an argument: it stays
    // quoted (literal) while its letters are transformed
    expect(pseudoLocalize("'{name}'")).toBe("['{ñåɱé}']");
    // A quoted '#' inside a plural option stays quoted (literal, not the count);
    // formatjs merges '# cats' into one literal element, so the whole literal is quoted
    expect(pseudoLocalize("{count, plural, other {'#' cats}}")).toBe("[{count, plural, other {'# çåţ§'}}]");
  });

  it('leaves ordinary apostrophes untouched', () => {
    expect(pseudoLocalize("don't panic")).toBe("[ðöñ'ţ þåñîç]");
  });

  it('never introduces ICU errors into message descriptors', () => {
    // Every descriptor in src/Messages.js must either stay parseable after
    // pseudo-localization, or already be unparseable in its source form.
    for (const message of enDefaults) {
      const pseudoValid = isParsable(pseudoLocalize(message));
      const sourceValid = isParsable(message);
      expect(pseudoValid || !sourceValid, `pseudo-localization corrupted: ${message}`).toBe(true);
    }
  });
});
