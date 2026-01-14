# Type-Safe Form Submission Pattern

**Pattern Type:** Forms & Validation  
**Status:** Standard  
**Last Updated:** 2026-01-14  

---

## Overview

The Type-Safe Form Submission pattern ensures runtime validation and compile-time type safety for dynamic form data, particularly useful with libraries like `@data-driven-forms/react-form-renderer`.

---

## The Problem

Form libraries often provide form data as generic objects:

```typescript
const onSubmit = (formData: Record<string, unknown>) => {
  // What's in formData? TypeScript doesn't know!
  const name = formData['role-name'];  // type: unknown
  const description = formData['role-description'];  // type: unknown
  
  // Unsafe casts required
  createRole.mutate({
    name: name as string,  // Runtime error if not a string!
    description: description as string,
  });
};
```

**Problems:**
- No compile-time type checking
- Unsafe type assertions (`as string`)
- Runtime errors if structure changes
- Hard to refactor

---

## The Solution

Combine TypeScript interfaces with runtime type guards:

```typescript
// 1. Define the shape
interface AddRoleFormData extends Record<string, unknown> {
  'role-name': string;
  'role-description'?: string;
  'add-permissions-table': Array<{ uuid: string }>;
}

// 2. Create a type guard
function isAddRoleFormData(data: Record<string, unknown>): data is AddRoleFormData {
  return (
    typeof data['role-name'] === 'string' &&
    Array.isArray(data['add-permissions-table'])
  );
}

// 3. Use in submission handler
const onSubmit = (formData: Record<string, unknown>) => {
  if (!isAddRoleFormData(formData)) {
    console.error('Invalid form data', formData);
    return;
  }
  
  // TypeScript now knows the exact shape!
  const { 'role-name': name, 'role-description': description } = formData;
  createRole.mutate({ name, description });  // Fully type-safe
};
```

---

## Implementation

### Step 1: Define the Form Data Interface

```typescript
interface AddRoleFormData extends Record<string, unknown> {
  // Required fields
  'role-name': string;
  'add-permissions-table': Array<{ uuid: string }>;
  
  // Optional fields
  'role-description'?: string;
  'copy-base-role'?: string;
  
  // Complex fields
  'cost-resources'?: Array<{
    permission: string;
    resources: string[];
  }>;
  'inventory-groups'?: Array<{
    permission: string;
    groups: string[];
  }>;
}
```

**Key points:**
- Extend `Record<string, unknown>` for compatibility with form libraries
- Use exact field names from the form schema
- Mark optional fields with `?`
- Define nested structures explicitly

### Step 2: Create a Type Guard

```typescript
function isAddRoleFormData(data: Record<string, unknown>): data is AddRoleFormData {
  // Check required fields
  if (typeof data['role-name'] !== 'string') {
    console.error('Missing or invalid role-name');
    return false;
  }
  
  if (!Array.isArray(data['add-permissions-table'])) {
    console.error('Missing or invalid add-permissions-table');
    return false;
  }
  
  // Optional: validate structure of arrays
  if (!data['add-permissions-table'].every((item) => typeof item.uuid === 'string')) {
    console.error('Invalid permission structure');
    return false;
  }
  
  return true;
}
```

**Key points:**
- Use `data is AddRoleFormData` return type (type predicate)
- Check all required fields
- Validate structure, not just presence
- Log useful error messages
- Return `false` for invalid data

### Step 3: Use in Submission Handler

```typescript
const onSubmit = (formData: Record<string, unknown>) => {
  // Runtime validation
  if (!isAddRoleFormData(formData)) {
    console.error('Invalid form data structure', formData);
    return;
  }
  
  // TypeScript now knows formData is AddRoleFormData
  const {
    'role-name': name,
    'role-description': description,
    'add-permissions-table': permissions,
    'cost-resources': costResources,
    'inventory-groups': inventoryGroups,
  } = formData;
  
  // Transform to API format
  const roleIn: RoleIn = {
    name,
    description,
    access: permissions.map((p) => ({
      permission: p.uuid,
      resourceDefinitions: [
        ...(costResources?.filter((r) => r.permission === p.uuid).flatMap((r) => 
          r.resources.map((resource) => ({
            attributeFilter: {
              key: 'cost-management.resource',
              operation: 'equal',
              value: resource,
            },
          }))
        ) || []),
        ...(inventoryGroups?.filter((g) => g.permission === p.uuid).flatMap((g) =>
          g.groups.map((group) => ({
            attributeFilter: {
              key: 'group.id',
              operation: 'in',
              value: [group],
            },
          }))
        ) || []),
      ],
    })),
  };
  
  // Type-safe mutation
  createRole.mutate(roleIn);
};
```

---

## Advanced: Nested Validation

For complex nested structures:

```typescript
interface Permission {
  uuid: string;
  permission?: string;
}

interface ResourceDefinitionFormData {
  permission: string;
  resources: string[];
}

function isPermission(item: unknown): item is Permission {
  return (
    typeof item === 'object' &&
    item !== null &&
    'uuid' in item &&
    typeof item.uuid === 'string'
  );
}

function isResourceDefinitionFormData(item: unknown): item is ResourceDefinitionFormData {
  return (
    typeof item === 'object' &&
    item !== null &&
    'permission' in item &&
    typeof item.permission === 'string' &&
    'resources' in item &&
    Array.isArray(item.resources) &&
    item.resources.every((r) => typeof r === 'string')
  );
}

function isAddRoleFormData(data: Record<string, unknown>): data is AddRoleFormData {
  if (typeof data['role-name'] !== 'string') return false;
  
  if (!Array.isArray(data['add-permissions-table'])) return false;
  if (!data['add-permissions-table'].every(isPermission)) return false;
  
  if (data['cost-resources'] !== undefined) {
    if (!Array.isArray(data['cost-resources'])) return false;
    if (!data['cost-resources'].every(isResourceDefinitionFormData)) return false;
  }
  
  return true;
}
```

---

## Testing

Type guards are easy to test:

```typescript
describe('isAddRoleFormData', () => {
  it('returns true for valid data', () => {
    const validData = {
      'role-name': 'Test Role',
      'add-permissions-table': [{ uuid: 'perm-1' }],
    };
    expect(isAddRoleFormData(validData)).toBe(true);
  });
  
  it('returns false for missing role-name', () => {
    const invalidData = {
      'add-permissions-table': [{ uuid: 'perm-1' }],
    };
    expect(isAddRoleFormData(invalidData)).toBe(false);
  });
  
  it('returns false for invalid permissions array', () => {
    const invalidData = {
      'role-name': 'Test Role',
      'add-permissions-table': 'not-an-array',
    };
    expect(isAddRoleFormData(invalidData)).toBe(false);
  });
});
```

---

## Common Mistakes

### ❌ Using Type Assertions Instead of Guards
```typescript
// Bad - no runtime validation
const name = formData['role-name'] as string;

// Good - runtime validation + type safety
if (!isAddRoleFormData(formData)) return;
const { 'role-name': name } = formData;
```

### ❌ Not Validating Optional Fields
```typescript
// Bad - assumes optional field exists
if (formData['role-description'].length > 0) { ... }  // Runtime error if undefined!

// Good - check before accessing
if (formData['role-description'] && formData['role-description'].length > 0) { ... }
```

### ❌ Forgetting the Type Predicate
```typescript
// Bad - doesn't narrow type
function isAddRoleFormData(data: Record<string, unknown>): boolean {
  return typeof data['role-name'] === 'string';
}

// Good - narrows type with 'data is AddRoleFormData'
function isAddRoleFormData(data: Record<string, unknown>): data is AddRoleFormData {
  return typeof data['role-name'] === 'string';
}
```

---

## Benefits

1. **Compile-Time Safety**: TypeScript catches missing fields and type mismatches
2. **Runtime Safety**: Type guards validate data structure at runtime
3. **Refactoring Confidence**: Rename a field, and TypeScript shows all usages
4. **Better Errors**: Specific error messages for validation failures
5. **Self-Documenting**: Interface shows exact form structure

---

## Integration with Data-Driven Forms

### Form Schema

```typescript
const schema = {
  fields: [
    {
      component: 'text-field',
      name: 'role-name',
      label: 'Role name',
      isRequired: true,
      validate: [{ type: 'required' }],
    },
    {
      component: 'textarea',
      name: 'role-description',
      label: 'Description',
    },
    {
      component: 'add-permissions-table',
      name: 'add-permissions-table',
      isRequired: true,
    },
  ],
};
```

### Form Component

```typescript
<FormRenderer
  schema={schema}
  onSubmit={(formData) => {
    if (!isAddRoleFormData(formData)) {
      console.error('Invalid form data', formData);
      return;
    }
    handleSubmit(formData);
  }}
/>
```

---

## Real-World Example

See `src/features/roles/add-role/AddRoleWizard.tsx` for a complete implementation:

```typescript
interface AddRoleFormData extends Record<string, unknown> {
  'role-name': string;
  'role-description'?: string;
  'copy-base-role'?: string;
  'add-permissions-table': Array<{ uuid: string; permission?: string }>;
  'cost-resources'?: Array<{ permission: string; resources: string[] }>;
  'inventory-groups'?: Array<{ permission: string; groups: string[] }>;
}

function isAddRoleFormData(data: Record<string, unknown>): data is AddRoleFormData {
  return (
    typeof data['role-name'] === 'string' &&
    Array.isArray(data['add-permissions-table']) &&
    data['add-permissions-table'].every(
      (item) => typeof item === 'object' && item !== null && 'uuid' in item && typeof item.uuid === 'string',
    )
  );
}

const AddRoleWizard: React.FC = () => {
  const createRole = useCreateRoleMutation();
  
  const onSubmit = (formData: Record<string, unknown>) => {
    if (!isAddRoleFormData(formData)) {
      console.error('Invalid form data structure', formData);
      return;
    }
    
    const { 'role-name': name, 'role-description': description, 'add-permissions-table': permissions } = formData;
    
    createRole.mutate({
      name,
      description,
      access: permissions.map((p) => ({ permission: p.uuid })),
    });
  };
  
  return <FormRenderer schema={schema} onSubmit={onSubmit} />;
};
```

---

## Related Patterns

- [Query Keys Factory](./query-keys-factory.md)
- [TypeScript Handbook: Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
- [Data-Driven Forms Documentation](https://data-driven-forms.org/)
