import { describe, expect, it } from 'vitest';
import { schemaBuilder as v2AddRoleSchemaBuilder } from '../schema';

describe('Cost resources validation in v2 role schemas', () => {
  it('v2 add-role schema makes cost-resources field optional', () => {
    const schema = v2AddRoleSchemaBuilder(false);
    const wizard = schema.fields[0] as { fields: { name: string; fields: { name: string; validate?: unknown[] }[] }[] };
    const costStep = wizard.fields.find((f) => f.name === 'cost-resources-definition');
    expect(costStep).toBeDefined();

    const costField = costStep?.fields.find((f) => f.name === 'cost-resources');
    expect(costField).toBeDefined();
    expect(costField?.validate).toBeUndefined();
  });
});
