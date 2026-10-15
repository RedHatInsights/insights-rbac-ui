/**
 * ICU-aware pseudo-localization (the "Jawa" / `jw` storybook locale).
 *
 * Each message is parsed with the FormatJS ICU parser and re-serialized with
 * ONLY literal text transformed. Tag names, argument placeholders, plural /
 * select selectors, `#` placeholders and number/date/time styles are preserved
 * verbatim, so the generated catalog stays valid ICU and exercises the same
 * rendering paths as real translations — including literals inside
 * plural/select branches, which naive brace-skipping leaves untouched.
 *
 * Messages that cannot be parsed (or use skeleton styles that cannot be
 * round-tripped) are returned untransformed rather than corrupted.
 */
import { TYPE, parse } from '@formatjs/icu-messageformat-parser';
import type { MessageFormatElement } from '@formatjs/icu-messageformat-parser';

const JAWA_MAP: Record<string, string> = {
  a: 'å',
  b: 'ß',
  c: 'ç',
  d: 'ð',
  e: 'é',
  f: 'ƒ',
  g: 'ğ',
  h: 'ĥ',
  i: 'î',
  j: 'ĵ',
  k: 'ķ',
  l: 'ł',
  m: 'ɱ',
  n: 'ñ',
  o: 'ö',
  p: 'þ',
  q: 'ǫ',
  r: 'ř',
  s: '§',
  t: 'ţ',
  u: 'ü',
  v: 'v',
  w: 'ŵ',
  x: 'x',
  y: 'ý',
  z: 'ž',
  A: 'Å',
  B: 'ß',
  C: 'Ç',
  D: 'Ð',
  E: 'É',
  F: 'Ƒ',
  G: 'Ğ',
  H: 'Ĥ',
  I: 'Î',
  J: 'Ĵ',
  K: 'Ķ',
  L: 'Ł',
  M: 'Ɱ',
  N: 'Ñ',
  O: 'Ö',
  P: 'Þ',
  Q: 'Ǫ',
  R: 'Ř',
  S: '§',
  T: 'Ţ',
  U: 'Ü',
  V: 'V',
  W: 'Ŵ',
  X: 'X',
  Y: 'Ý',
  Z: 'Ž',
};

function jawa(text: string): string {
  let result = '';
  for (const ch of text) {
    result += JAWA_MAP[ch] ?? ch;
  }
  return result;
}

function serializeStyle(style: string | object | null | undefined): string {
  if (typeof style === 'string') {
    return style;
  }
  // Skeleton styles (`::percent` etc.) cannot be round-tripped to source syntax.
  throw new Error('Unsupported ICU style');
}

function serializeOptions(options: Record<string, { value: MessageFormatElement[] }>, transform: boolean): string {
  return Object.entries(options)
    .map(([selector, option]) => `${selector} {${serialize(option.value, transform)}}`)
    .join(' ');
}

function needsEscaping(value: string): boolean {
  // `{`, `}` and `#` are ICU syntax, and an apostrophe is syntax only when
  // immediately followed by one of those (or by another apostrophe).
  return /[{}#]/.test(value) || /'(?=['{}#])/.test(value);
}

/** Quote a literal so transformed text stays literal text in ICU. */
function escapeLiteral(value: string): string {
  if (!needsEscaping(value)) return value;
  return `'${value.replace(/'/g, "''")}'`;
}

function serializeElement(el: MessageFormatElement, transform: boolean): string {
  switch (el.type) {
    case TYPE.literal:
      return transform ? escapeLiteral(jawa(el.value)) : el.value;
    case TYPE.argument:
      return `{${el.value}}`;
    case TYPE.pound:
      return '#';
    case TYPE.number:
      return `{${el.value}, number${el.style ? `, ${serializeStyle(el.style)}` : ''}}`;
    case TYPE.date:
      return `{${el.value}, date${el.style ? `, ${serializeStyle(el.style)}` : ''}}`;
    case TYPE.time:
      return `{${el.value}, time${el.style ? `, ${serializeStyle(el.style)}` : ''}}`;
    case TYPE.select:
      return `{${el.value}, select, ${serializeOptions(el.options, transform)}}`;
    case TYPE.plural: {
      const keyword = el.pluralType === 'ordinal' ? 'selectordinal' : 'plural';
      const offset = el.offset ? `offset:${el.offset} ` : '';
      return `{${el.value}, ${keyword}, ${offset}${serializeOptions(el.options, transform)}}`;
    }
    case TYPE.tag:
      return `<${el.value}>${serialize(el.children, transform)}</${el.value}>`;
    default:
      // Exhaustiveness guard: every TYPE member is handled above.
      throw new Error('Unsupported ICU element type');
  }
}

function serialize(elements: MessageFormatElement[], transform: boolean): string {
  return elements.map((el) => serializeElement(el, transform)).join('');
}

/**
 * Pseudo-localize a single ICU message.
 *
 * The result is wrapped in [brackets] so pseudo-translated strings are visually
 * obvious and unbounded growth is detectable in snapshots.
 */
export function pseudoLocalize(message: string): string {
  try {
    return `[${serialize(parse(message), true)}]`;
  } catch {
    return `[${message}]`;
  }
}
