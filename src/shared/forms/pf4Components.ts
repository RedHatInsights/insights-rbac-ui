import componentTypes from '@data-driven-forms/react-form-renderer/component-types';
import type { Schema } from '@data-driven-forms/react-form-renderer/common-types/schema';
import { components } from '@data-driven-forms/pf4-component-mapper/component-mapper';
import Wizard from '@data-driven-forms/pf4-component-mapper/wizard';
import type React from 'react';

/**
 * ddf's `WizardFunctionProps` declares `fields: Field[]`, where `Field`
 * requires a `component` string — but wizard steps (`{ name, title, fields,
 * nextStep, buttons }`) are not components and never carry one, so the stock
 * typing rejects every real wizard schema. Widen the entry to a permissive
 * component type: wizard internals were index-signature-loose anyway, and
 * the schema-level guarantees we care about (component keys, field props)
 * come from the other mapper entries.
 */
const WizardComponent = Wizard as unknown as React.ComponentType<Record<string, unknown>>;

/**
 * PatternFly 4 data-driven-forms mapper entries with literal string keys.
 *
 * The default export of `@data-driven-forms/pf4-component-mapper/component-mapper`
 * is declared as the loose `ComponentMapper` interface (a string index
 * signature), which erases the key information `Schema<T>` needs. Assembling
 * the mapper from the per-component exports instead preserves the literal
 * keys, so `Schema<typeof mapper>` can validate that every `component:` value
 * in a schema is a key that the renderer actually registered.
 *
 * Only the components our schemas use are listed. When a schema needs another
 * stock component, add its entry here — the compiler will ask for it.
 */
export const pf4Components = {
  [componentTypes.WIZARD]: WizardComponent,
  [componentTypes.TEXT_FIELD]: components.TextField,
  [componentTypes.TEXTAREA]: components.Textarea,
  [componentTypes.CHECKBOX]: components.Checkbox,
  [componentTypes.PLAIN_TEXT]: components.PlainText,
  [componentTypes.DUAL_LIST_SELECT]: components.DualListSelect,
};

/** Schema for renderers that use only the stock PatternFly 4 components. */
export type Pf4Schema = Schema<typeof pf4Components>;
