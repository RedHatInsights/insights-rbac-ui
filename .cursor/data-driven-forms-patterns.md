# Data-Driven Forms - Development Rules

## Quick Reference (AI Priority)

### Critical Form Rules
| Pattern | Correct | Incorrect | Impact |
|---|---|---|
| **Form nesting** | ONE form per tree | Nested `<Form>` or `FormRenderer` | Invalid HTML, submit breaks |
| **Custom components** | Read from `formOptions` | Create own `<Form>` | Nested forms |
| **FormWrapper** | Use default or plain function | React.FC with types | PropTypes errors (PF5) |
| **Conditional ignores** | Check PF version | Blanket ignore | Miss real bugs on upgrade |

### ❌ NEVER DO (HTML Breaking)
| Pattern | Problem | Result |
|---|---|-----|
| `<Form>` in custom field | Creates nested forms | `validateDOMNesting` error |
| `<FormRenderer>` in field | Double form creation | Submit doesn't work |
| Complex FormWrapper types | PF5 PropTypes broken | Test failures |

### ✅ ALWAYS DO
| Pattern | Reason | Example |
|---|-----|---|
| Use `formOptions` | Access parent form | `formOptions.getState()` |
| Plain FormWrapper | PF5 compatibility | `function FormWrapper(props) { ... }` |
| Check PF version | Conditional ignores | `PATTERNFLY_VERSION < 6` |

---

## Context

This codebase uses `@data-driven-forms/react-form-renderer` with PatternFly component mapper. **Version compatibility issues exist with PatternFly 5.**

### Critical Discovery: Nested Forms Are User Error
During our session, we discovered `validateDOMNesting` warnings about `<form>` inside `<form>` were NOT library bugs, but user error in custom field components.

---

## Part 1: Understanding FormRenderer Architecture

### How FormRenderer Works

```typescript
<FormRenderer
  schema={schema}              // Field definitions
  componentMapper={mapper}     // Component lookup
  FormTemplate={Template}      // Wrapper (buttons, layout)
  onSubmit={handleSubmit}
/>
```

**What it creates:**
```html
<form>                        <!-- Created by FormTemplate/FormWrapper -->
  <div>                       <!-- Your FormTemplate layout -->
    <CustomField1 />          <!-- From componentMapper -->
    <CustomField2 />          <!-- From componentMapper -->
    <button type="submit">    <!-- From FormTemplate -->
  </div>
</form>
```

**Critical rule**: `FormRenderer` creates exactly **ONE** `<form>` element. Custom field components render **inside** that form.

---

## Part 2: The Nested Form Bug

### Real Production Bug We Fixed

```typescript
// ❌ WRONG - Creates nested forms
const SetUsers: React.FC<SetUsersProps> = ({ label, formOptions }) => {
  return (
    <FormRenderer                          // ← Creates <form> #2 (NESTED!)
      schema={usersSchema}
      componentMapper={componentMapper}
      FormTemplate={FormTemplate}
      onSubmit={(values) => {
        formOptions.change('users-list', values.selectedUsers);
      }}
    />
  );
};

// Usage in parent schema
const parentSchema = {
  fields: [
    {
      component: 'set-users',              // ← Rendered inside parent <form>
      name: 'users-list',
    },
  ],
};

// Result:
// <form>                  ← Parent FormRenderer
//   <form>                ← SetUsers FormRenderer (NESTED! INVALID HTML!)
//     <input ... />
//   </form>
// </form>
```

**Browser behavior:**
- Nested forms are invalid HTML
- Browser closes inner `</form>` early
- Submit events don't propagate correctly
- React warns: `validateDOMNesting(...): <form> cannot appear as a descendant of <form>`

---

### The Correct Pattern

```typescript
// ✅ CORRECT - Uses parent form context
const SetUsers: React.FC<SetUsersProps> = ({ label, formOptions }) => {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  
  // Use formOptions to interact with parent form
  const handleSelectionChange = (users: User[]) => {
    setSelectedUsers(users);
    formOptions.change('users-list', users);  // ← Update parent form field
  };
  
  return (
    <div>                                     // ← Just a div! No form!
      <Title headingLevel="h3">{label}</Title>
      <UsersList 
        onSelect={handleSelectionChange}
        initialSelected={selectedUsers}
      />
    </div>
  );
};
```

**Result:**
```html
<form>                  ← ONE form from parent FormRenderer
  <div>                 ← SetUsers component
    <h3>Select Users</h3>
    <table>...</table>
  </div>
</form>
```

---

## Part 3: Accessing Parent Form State

### Using `formOptions` API

Every custom field component receives `formOptions` prop with full form API:

```typescript
interface CustomFieldProps {
  label?: string;
  name: string;
  formOptions: {
    getState: () => FormState;           // Get entire form state
    change: (field: string, value: any) => void;  // Update field
    getFieldState: (field: string) => FieldState;  // Get specific field
    renderForm: (fields: Field[]) => JSX.Element;  // Render nested fields
  };
}
```

### Common Patterns

```typescript
// ✅ Read current field value
const currentValue = formOptions.getFieldState('my-field')?.value;

// ✅ Update another field
formOptions.change('related-field', newValue);

// ✅ Get entire form state
const formState = formOptions.getState();
const allValues = formState.values;

// ✅ Render nested fields
const nestedFields = [
  { component: 'text-field', name: 'nested-1' },
  { component: 'text-field', name: 'nested-2' },
];
return <div>{formOptions.renderForm(nestedFields)}</div>;
```

---

## Part 4: PatternFly 5 Compatibility Issues

### Known Issues with @data-driven-forms + PatternFly 5

1. **FormWrapper PropTypes Error**
   - `@data-driven-forms` expects specific FormWrapper type
   - PatternFly 5's PropTypes don't match
   - **Fix**: Use plain function, not `React.FC`

2. **setState During Render**
   - Form library triggers state updates during render
   - Causes React warning
   - **Fix**: Ignore on PF5, enforce on PF6

### Conditional Ignoring Pattern

```typescript
// .storybook/test-runner.ts

function getPatternFlyVersion(): number {
  const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
  const pfVersion = packageJson.dependencies?.['@patternfly/react-core'];
  const match = pfVersion.match(/(\d+)\./);
  return match ? parseInt(match[1], 10) : 0;
}

const PATTERNFLY_VERSION = getPatternFlyVersion();

const IGNORED_ERROR_PATTERNS = [
  // Only ignore on PF5, enforce on PF6
  ...(PATTERNFLY_VERSION < 6 ? [
    /Invalid prop `FormWrapper` supplied to `FormTemplate`/,
    /Cannot update a component.*while rendering a different component/,
  ] : []),
];

console.log(`📦 PatternFly Version Detected: ${PATTERNFLY_VERSION}`);
if (PATTERNFLY_VERSION < 6) {
  console.log(`⚠️  @data-driven-forms compatibility issues will be IGNORED`);
  console.log(`   Upgrade to PatternFly 6 + @data-driven-forms v4.x to enforce`);
}
```

### FormWrapper Implementation

```typescript
// ❌ WRONG - Causes PropTypes errors on PF5
const CustomFormWrapper: React.FC<FormWrapperProps> = (props) => {
  return <Form {...props} id="my-form" />;
};

// ✅ CORRECT - Plain function works
function CustomFormWrapper(props: any) {
  return <Form {...props} id="my-form" />;
}

// Usage
<FormRenderer
  FormTemplate={(props) => (
    <ModalFormTemplate
      {...props}
      FormWrapper={CustomFormWrapper}  // ← Plain function, not React.FC
    />
  )}
/>
```

---

## Part 5: Custom Field Component Checklist

When creating custom field components for data-driven-forms:

### HTML Structure ✓
- [ ] No `<Form>` elements in component
- [ ] No nested `FormRenderer`
- [ ] Returns plain `<div>` or fragment
- [ ] Properly handles field value updates

### Form Integration ✓
- [ ] Receives and uses `formOptions` prop
- [ ] Updates parent form via `formOptions.change()`
- [ ] Reads initial values from `formOptions`
- [ ] Doesn't maintain duplicate state

### Type Safety ✓
- [ ] Props interface includes `formOptions`
- [ ] Typed field name: `name: string`
- [ ] Value type matches field schema
- [ ] Optional props marked correctly

### Component Registration ✓
- [ ] Added to `componentMapper` object
- [ ] Schema uses correct component name
- [ ] Props match what parent passes
- [ ] Works inside FormRenderer

---

## Part 6: Debugging Nested Form Issues

### Symptoms of Nested Forms
- ✗ `validateDOMNesting` console warning
- ✗ Submit button doesn't work
- ✗ Form validation broken
- ✗ Browser DevTools shows `<form>` inside `<form>`

### How to Diagnose

**Step 1: Inspect HTML in DevTools**
```html
<!-- If you see this, you have nested forms -->
<form>
  <div>
    <form>        <!-- ← NESTED! This is the problem -->
      <input ... />
    </form>
  </div>
</form>
```

**Step 2: Check Custom Field Components**
```bash
# Search for Form or FormRenderer in custom fields
grep -r "FormRenderer\|<Form" src/features/*/components/step*
```

**Step 3: Verify Component Mapper**
```typescript
// Check what components are being used
console.log(Object.keys(componentMapper));

// Check schema
console.log(schema.fields.map(f => f.component));
```

### Quick Fix Pattern

```typescript
// BEFORE - Nested form
const CustomField = ({ formOptions }) => (
  <FormRenderer schema={subSchema} onSubmit={...} />  // ← Remove this
);

// AFTER - Use parent form
const CustomField = ({ formOptions }) => {
  const handleChange = (value) => {
    formOptions.change('field-name', value);          // ← Update parent
  };
  
  return <YourCustomUI onChange={handleChange} />;    // ← Just UI
};
```

---

## Part 7: Schema Design Patterns

### Nested Field Groups (Correct Way)

```typescript
// ✅ CORRECT - Use renderForm for nested fields
const CustomFieldGroup: React.FC<CustomFieldProps> = ({ formOptions }) => {
  const nestedFields = [
    { component: 'text-field', name: 'firstName', label: 'First Name' },
    { component: 'text-field', name: 'lastName', label: 'Last Name' },
  ];
  
  return (
    <div>
      <Title>Name Information</Title>
      {formOptions.renderForm(nestedFields)}  {/* ← Renders in parent form */}
    </div>
  );
};

// ❌ WRONG - Don't create sub-form
const CustomFieldGroup: React.FC<CustomFieldProps> = ({ formOptions }) => {
  return (
    <FormRenderer                             {/* ← Creates nested form! */}
      schema={{ fields: [...] }}
      onSubmit={...}
    />
  );
};
```

### Conditional Fields Pattern

```typescript
// ✅ CORRECT - Conditional rendering
const ConditionalField: React.FC<CustomFieldProps> = ({ formOptions }) => {
  const formState = formOptions.getState();
  const showAdvanced = formState.values.showAdvanced;
  
  const conditionalFields = showAdvanced ? [
    { component: 'text-field', name: 'advanced1' },
    { component: 'text-field', name: 'advanced2' },
  ] : [];
  
  return (
    <div>
      {formOptions.renderForm(conditionalFields)}  {/* ← Still one form */}
    </div>
  );
};
```

---

## Part 8: Test Runner Integration

### Detecting Nested Form Errors

```typescript
// .storybook/test-runner.ts

const CRITICAL_ERROR_PATTERNS = [
  // Always catch nested forms (user error, not library issue)
  /validateDOMNesting.*<form>.*form/,
  
  // Catch in PF6+, ignore in PF5 (library compatibility)
  ...(PATTERNFLY_VERSION >= 6 ? [
    /Invalid prop `FormWrapper` supplied to `FormTemplate`/,
    /Cannot update a component.*while rendering a different component/,
  ] : []),
];
```

### When to Ignore vs Fail

| Error | PF5 Action | PF6 Action | Reason |
|---|---|---|---|
| Nested `<form>` | ❌ FAIL | ❌ FAIL | User error, always wrong |
| FormWrapper PropTypes | ⚠️ IGNORE | ❌ FAIL | Library bug in PF5, fixed in PF6 |
| setState during render | ⚠️ IGNORE | ❌ FAIL | Library issue in PF5, fixed in v4.x |

---

## Part 9: Migration to PatternFly 6

### Pre-Upgrade Checklist
- [ ] All nested forms fixed
- [ ] All custom fields use `formOptions`
- [ ] FormWrapper uses plain function
- [ ] Conditional ignores documented
- [ ] Test runner configured for version detection

### Upgrade Process
1. **Update dependencies**
   ```bash
   npm install @patternfly/react-core@6 @data-driven-forms/react-form-renderer@4
   ```

2. **Test runner automatically enforces**
   - Nested form errors → FAIL (already enforcing)
   - FormWrapper errors → FAIL (now enforced)
   - setState errors → FAIL (now enforced)

3. **Fix any new failures**
   - Should be minimal if conditionally ignored correctly
   - All technical debt already documented

---

## Real-World Example: SetUsers Fix

### Before (BROKEN)
```typescript
// src/features/groups/add-group/components/stepUsers/SetUsers.tsx
const SetUsers: React.FC<SetUsersProps> = ({ label, formOptions }) => {
  return (
    <FormRenderer                                    // ← Creates nested form!
      schema={usersSchema}
      componentMapper={usersComponentMapper}
      FormTemplate={FormTemplate}
      onSubmit={(values) => {
        formOptions.change('users-list', values.selectedUsers);
      }}
    />
  );
};
```

**Result**: `validateDOMNesting(...): <form> cannot appear as a descendant of <form>`

### After (FIXED)
```typescript
const SetUsers: React.FC<SetUsersProps> = ({ label, formOptions }) => {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  
  const handleSelectionChange = (users: User[]) => {
    setSelectedUsers(users);
    formOptions.change('users-list', users);         // ← Update parent form
  };
  
  return (
    <div className="pf-v5-u-m-md">                   // ← Just a container
      <Title headingLevel="h3" size={TitleSizes.md}>
        {label}
      </Title>
      <UsersList 
        onSelect={handleSelectionChange}
        initialSelectedUsers={selectedUsers}
      />
    </div>
  );
};
```

**Result**: ✅ Single form, no nesting, submit works correctly

---

## Enforcement Rules

### Code Review Checklist
- ❌ Flag `<Form>` or `FormRenderer` in custom field components
- ❌ Flag custom fields not using `formOptions`
- ❌ Flag `React.FC` for FormWrapper components
- ❌ Flag unconditional error ignores for PF5 issues
- ✅ Require `formOptions.change()` for field updates
- ✅ Require version detection for library compatibility

### When to Reject Changes
1. Nested forms → "Remove inner FormRenderer, use formOptions"
2. No formOptions usage → "Connect to parent form via formOptions"
3. Complex FormWrapper → "Use plain function"
4. New blanket ignores → "Make conditional on PF version"

---

## Quick Reference Summary

```typescript
// ✅ Custom field pattern
const CustomField: React.FC<{ formOptions: any }> = ({ formOptions }) => {
  const handleChange = (value) => formOptions.change('field-name', value);
  return <div><YourUI onChange={handleChange} /></div>;  // No Form!
};

// ✅ FormWrapper pattern
function CustomFormWrapper(props: any) {  // Plain function
  return <Form {...props} id="custom-form" />;
}

// ✅ Conditional ignore pattern
const IGNORED = [
  ...(PATTERNFLY_VERSION < 6 ? [/FormWrapper PropTypes/] : []),
];

// ❌ NEVER nested forms
const BadField = () => (
  <FormRenderer ... />  // NO! This creates a nested form!
);
```

---

## Rationale

These rules prevent:
1. **Invalid HTML**: Nested forms violate HTML spec
2. **Broken functionality**: Nested forms break submit behavior
3. **Test failures**: Library compatibility issues on PF5
4. **Future bugs**: Conditional ignores ensure PF6 upgrade catches issues

**Real Impact**: Fixing nested form bug resolved test failures and prepared upgrade path to PF6.

