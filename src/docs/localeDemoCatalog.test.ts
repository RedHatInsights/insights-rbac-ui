import { type MessageFormatElement, TYPE, parse } from '@formatjs/icu-messageformat-parser';
import sourceCatalog from '../../locales/translation-template.json';
import demoCatalog from '../../.storybook/locales/zh-CN.demo.json';

const source: Record<string, { defaultMessage: string }> = sourceCatalog;
const demo: Record<string, string> = demoCatalog;

/** Argument and tag names a message uses, e.g. ['arg:count', 'arg:name', 'tag:b']. */
function placeholders(message: string): string[] {
  const names = new Set<string>();
  const walk = (elements: MessageFormatElement[]) => {
    for (const el of elements) {
      if (el.type === TYPE.tag) {
        names.add(`tag:${el.value}`);
        walk(el.children);
      } else if (el.type === TYPE.select || el.type === TYPE.plural) {
        names.add(`arg:${el.value}`);
        Object.values(el.options).forEach((option) => walk(option.value));
      } else if (el.type !== TYPE.literal && el.type !== TYPE.pound) {
        names.add(`arg:${el.value}`);
      }
    }
  };
  walk(parse(message));
  return [...names].sort();
}

// Ensures the Storybook demo catalog uses source IDs and preserves ICU placeholders.
describe('zh-CN demo catalog', () => {
  it.each(Object.keys(demo))('%s exists in the source catalog with matching placeholders', (id) => {
    expect(source[id]).toBeDefined();
    expect(placeholders(demo[id])).toEqual(placeholders(source[id].defaultMessage));
  });
});
