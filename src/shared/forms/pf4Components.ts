import componentTypes from '@data-driven-forms/react-form-renderer/component-types';
import type { Schema } from '@data-driven-forms/react-form-renderer/common-types/schema';
import { components } from '@data-driven-forms/pf4-component-mapper/component-mapper';
import Wizard from '@data-driven-forms/pf4-component-mapper/wizard';
import type React from 'react';

/**
 * A wizard step, as consumed by ddf's wizard implementation.
 * Steps are not components — they never carry a `component` key — but they
 * always carry a `name`, which the wizard uses for `nextStep` navigation.
 */
export interface WizardStep {
  name: string;
  [key: string]: unknown;
}

/**
 * Runtime contract of a ddf wizard field.
 *
 * ddf's own `WizardFunctionProps` declares `fields: Field[]`, where `Field`
 * requires a `component` string. Since the wizard is step-based by design and
 * steps are not components, no wizard schema can satisfy that declaration —
 * it is a bug in the library's types, not a constraint worth preserving. This
 * interface records what the wizard actually accepts at runtime: a list of
 * named steps plus ddf's index-signature-loose props.
 *
 * The cast below exists solely to install this corrected contract in the
 * mapper; when the typing is fixed upstream (data-driven-forms/react-forms),
 * delete `WizardFieldProps` and register `Wizard` directly.
 */
export interface WizardFieldProps {
  fields?: WizardStep[];
  [key: string]: unknown;
}

// See WizardFieldProps — replaces ddf's unsatisfiable `fields: Field[]`.
const WizardComponent = Wizard as unknown as React.ComponentType<WizardFieldProps>;

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
