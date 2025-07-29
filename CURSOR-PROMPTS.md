# Cursor AI Prompts - Storybook Story Development

*Quick reference for effective prompts when creating component stories in Storybook*

> **📖 Primary Guide:** The complete Storybook guide with all enhanced features and best practices is available in Storybook at `Documentation/Storybook Guide`. These prompts reference the external quick reference file `CURSOR-CONTEXT.md` for Cursor development.

## **📋 Copy-Paste Ready Prompts**

### **🎨 Storybook Stories**

**Create new stories:**
```
Following the guidelines in CURSOR-CONTEXT.md, create Storybook stories for [ComponentName]
```

**Investigate before creating:**
```
Following the investigation process in CURSOR-CONTEXT.md, analyze [ComponentName] and determine how to create proper stories for it
```

**Fix existing stories:**
```
Using the patterns in CURSOR-CONTEXT.md, fix the issues with [ComponentName] stories - focus on [specific issue area]
```

### **🔧 Component Development**

**Table row wrappers:**
```
Following CURSOR-CONTEXT.md guidelines, help me implement [ComponentName] as a PatternFly table row wrapper
```

**General component work:**
```
Following CURSOR-CONTEXT.md guidelines, help me implement [ComponentName] - it should [describe functionality]
```

**TypeScript fixes:**
```
Using the TypeScript patterns in CURSOR-CONTEXT.md, fix the type issues in [ComponentName]
```

### **🔍 Investigation & Analysis**

**Check dependency versions:**
```
Check package.json for [PatternFly/Storybook/React] version and ensure we use the correct documentation for [ComponentName] work
```

**Understand existing component:**
```
Following the investigation process in CURSOR-CONTEXT.md, analyze how [ComponentName] works and what data it expects
```

**Compare with working examples:**
```
Using CURSOR-CONTEXT.md patterns, compare [ComponentName] with [WorkingComponent] and identify what needs to be fixed
```

**Data structure analysis:**
```
Following CURSOR-CONTEXT.md guidelines, analyze the data flow in [ComponentName] and identify any mismatches
```

### **🚀 Build & Quality**

**Pre-submission check:**
```
Using the quality checklist in CURSOR-CONTEXT.md, verify that [ComponentName] and its stories are ready for submission
```

**Build/lint fixes:**
```
Following CURSOR-CONTEXT.md patterns, fix the build/lint errors in [ComponentName] - errors: [paste errors]
```

## **💡 Usage Tips**

### **How to Customize Prompts:**
1. Replace `[ComponentName]` with actual component name
2. Replace `[specific issue area]` with your focus (TypeScript, data structure, etc.)
3. Add specific error messages or requirements as needed

### **When to Use Each Prompt:**
- **Create stories** → Use when starting fresh with a component
- **Investigate first** → Use when you're unsure about component behavior
- **Fix issues** → Use when stories exist but have problems
- **Component development** → Use when building/modifying components
- **Quality check** → Use before finalizing work

### **Combining Prompts:**
You can chain prompts for complex work:
```
1. Following the investigation process in CURSOR-CONTEXT.md, analyze EditUserGroup
2. Then following the guidelines in CURSOR-CONTEXT.md, create Storybook stories for EditUserGroup
```

## **🔗 Related Files**
- `CURSOR-CONTEXT.md` - Detailed guidelines and best practices
- Component files in `src/presentational-components/` and `src/smart-components/`

---

**Quick Start:** Copy any prompt above, replace the bracketed placeholders, and paste into your chat! 