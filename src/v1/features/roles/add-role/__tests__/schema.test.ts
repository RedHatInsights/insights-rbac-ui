import { describe, expect, it } from 'vitest';
import { schemaBuilder as v1AddRoleSchemaBuilder } from '../schema';
import { schemaBuilder as v1AddRolePermissionsSchemaBuilder } from '../../add-role-permissions/schema';

describe('Cost resources validation in v1 role schemas', () => {
  it('v1 add-role schema makes cost-resources field optional', () => {
    const schema = v1AddRoleSchemaBuilder(false);
    const wizard = schema.fields[0] as { fields: { name: string; fields: { name: string; validate?: unknown[] }[] }[] };
    const costStep = wizard.fields.find((f) => f.name === 'cost-resources-definition');
    expect(costStep).toBeDefined();

    const costField = costStep?.fields.find((f) => f.name === 'cost-resources');
    expect(costField).toBeDefined();
    expect(costField?.validate).toBeUndefined();
  });

  it('v1 add-role-permissions schema makes cost-resources field optional', () => {
    const schema = v1AddRolePermissionsSchemaBuilder(false);
    const wizard = schema.fields[0] as { fields: { name: string; fields: { name: string; validate?: unknown[] }[] }[] };
    const costStep = wizard.fields.find((f) => f.name === 'cost-resources-definition');
    expect(costStep).toBeDefined();

    const costField = costStep?.fields.find((f) => f.name === 'cost-resources');
    expect(costField).toBeDefined();
    expect(costField?.validate).toBeUndefined();
  });
});
