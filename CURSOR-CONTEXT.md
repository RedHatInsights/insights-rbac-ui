# Storybook Story Development - Quick Reference

*External quick reference for Cursor AI development - Full guide available in Storybook*

> **📖 Complete Guide:** The comprehensive guide with all enhanced features is available in Storybook at `Documentation/Storybook Guide`. This file serves as a quick external reference for Cursor development.

## **🎯 Story Development Principles**

### **Focus on the Component, Not Wrappers**
- ✅ Stories should document the **actual component** being developed
- ❌ Don't let stories document complex wrapper components (like `TableToolbarView`)
- ✅ Use Storybook's **autotitle feature** - don't set custom `title` in meta
- ✅ Set `component: ActualComponent` in meta object

### **Story Structure Best Practices**
```typescript
const meta: Meta<typeof ComponentName> = {
  component: ComponentName,  // The actual component being documented
  // No title - let Storybook auto-generate from file path
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `Clear description of what the component does and how it works`
      }
    }
  }
};
```

## **🔧 PatternFly Integration Patterns**

### **Table Row Wrappers**
- ✅ Use `RowWrapperProps` interface from PatternFly
- ✅ Implement as: `({ row, ...props }: RowWrapperProps) => JSX.Element`
- ✅ Use complete `Table` structure in stories:
```typescript
<Table aria-label="Description" cells={columns} rowWrapper={Component} rows={data}>
  <TableHeader />
  <TableBody />
</Table>
```

### **TypeScript Compatibility**
- ✅ Import proper PatternFly types: `import { RowWrapperProps } from '@patternfly/react-table'`
- ✅ Use type assertions when needed: `args.row!` for story arguments
- ✅ Ensure component return types match PatternFly expectations

## **📊 Data Structure Understanding**

### **Know Your Component's Data Dependencies**
- ✅ Understand what data the component **actually reads** from props
- ✅ For table components, understand the expected row structure
- ✅ Example: `UsersRow` reads `row.status.props['data-is-active']`, not `row.cells`

### **Realistic vs Mock Data**
- ✅ Use **realistic data structures** that match production usage
- ✅ Include actual PatternFly components (Labels, Icons, etc.) in cell data
- ❌ Don't use generic mock data that doesn't reflect real usage
- ✅ Add `key` props to JSX elements in arrays

## **🚫 Common Pitfalls to Avoid**

### **Complex Story Wrappers**
- ❌ Don't use `TableToolbarView` or similar complex components in stories
- ❌ Avoid components that cause React hooks issues
- ✅ Use minimal, focused wrappers that showcase the component

### **TypeScript Issues**
- ❌ Don't create overly restrictive custom interfaces when PatternFly types exist
- ❌ Don't ignore TypeScript errors - fix them with proper types
- ✅ Use PatternFly's provided interfaces and extend them if needed

### **Data Structure Mismatches**
- ❌ Don't assume component uses `cells` array if it doesn't
- ❌ Don't create data structures that don't match component expectations
- ✅ Trace through component code to understand actual data flow

### **Story Titles**
- ❌ Don't set custom `title` in meta object
- ✅ Let Storybook auto-generate titles from file path structure
- ✅ Organize files in logical directory structure for good auto-titles

## **✅ Quality Checklist**

### **Before Submitting Stories:**
- [ ] **Verified dependency versions** in `package.json` and used correct documentation
- [ ] Stories document the target component, not wrappers
- [ ] No custom `title` in meta (using autotitle)
- [ ] All TypeScript errors resolved
- [ ] `npm run build` passes
- [ ] `npm run lint:js` passes (no errors, warnings OK)
- [ ] Realistic data structures used
- [ ] PatternFly components properly integrated
- [ ] JSX elements in arrays have `key` props
- [ ] Stories show different component states/behaviors

### **Component Development:**
- [ ] **Checked dependency versions** for accurate API usage
- [ ] Uses appropriate PatternFly interfaces
- [ ] Handles undefined/missing data gracefully
- [ ] Returns correct type expected by PatternFly
- [ ] Follows existing codebase patterns
- [ ] Properly typed with TypeScript

## **🔄 Investigation Process**

### **When Working with Existing Components:**
1. **Check dependency versions** - Look at `package.json` for PatternFly, React, and other library versions to use correct documentation
2. **Understand the component's role** - Is it a wrapper? What does it wrap?
3. **Check actual usage** - Look at how it's used in the codebase
4. **Understand data flow** - What data does it actually read/use?
5. **Check PatternFly patterns** - What interfaces should it implement? (Use version-specific docs)
6. **Verify with build/lint** - Ensure changes don't break anything

### **When Creating Stories:**
1. **Check dependency versions first** - Ensure using correct Storybook and PatternFly documentation
2. **Focus on the component** - Not the ecosystem around it
3. **Use realistic data** - Match production data structures
4. **Test edge cases** - Active/inactive, missing data, undefined states
5. **Keep it simple** - Minimal wrapper, maximum component focus

### **Version-Specific Documentation Sources:**
- **PatternFly React**: Check version in `package.json`, then use corresponding docs
  - Example: `@patternfly/react-table@4.x.x` vs `@patternfly/react-table@5.x.x` have different APIs
- **Storybook**: Use version-specific documentation for story formats and meta configurations
- **React**: Ensure patterns match the React version being used
- **TypeScript**: Check for version-specific type definitions and features

## **📝 Key Technical Patterns**

### **Row Wrapper Pattern:**
```typescript
const ComponentRow = ({ row, ...props }: RowWrapperProps) => {
  const { relevantData } = row || {};
  const computedValue = relevantData?.nested?.property;
  return <RowWrapper className={classNames('base-class', { 'conditional-class': computedValue })} row={row} {...props} />;
};
```

### **Story Pattern for Table Components:**
```typescript
export const StoryName: Story = {
  render: (args) => (
    <Table aria-label="Table description" cells={columns} rowWrapper={Component} rows={[args.row!]}>
      <TableHeader />
      <TableBody />
    </Table>
  ),
  args: {
    row: {
      uuid: 'unique-id',
      cells: [<Component key="cell">Content</Component>, 'data', 'more data'],
      expectedProperty: { nested: { data: true } }
    }
  }
};
```

### **Basic Story Meta Pattern:**
```typescript
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import ComponentName from './ComponentName';

const meta: Meta<typeof ComponentName> = {
  component: ComponentName,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Component description explaining:
- What it does
- How it's used
- Expected data structure
- Any special behaviors
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ComponentName>;
```

## **🎨 Story Organization**

### **File Structure for Good Auto-Titles**
- Place stories next to components: `ComponentName.stories.tsx`
- Use descriptive directory names that will generate good titles
- Example: `src/presentational-components/shared/UsersRow.stories.tsx` 
  → Auto-title: "Presentational Components/Shared/Users Row"

### **Story Naming Conventions**
- Use descriptive story names that explain the state/scenario
- Examples: `ActiveUser`, `InactiveUser`, `NoStatus`, `Comparison`
- Avoid generic names like `Default`, `Example`, `Basic`

---

**💡 Remember:** The goal is to create focused, realistic, and maintainable component stories that serve as both documentation and testing tools. Always prioritize the component being documented over the complexity of its environment. Let Storybook handle titles automatically for consistency. 