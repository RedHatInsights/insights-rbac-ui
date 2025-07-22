---
title: Redux Helpers API Client Rules
description: Rules for working with Redux helpers and API client libraries, specifically handling broken @redhat-cloud-services/rbac-client types
author: Development Team
date: 2025-07-25
version: 1.0
tags: [redux, api, typescript, rbac-client]
scope: src/redux/**/*.{ts,js}
---

# Redux Helpers - API Client Development Rules

## Context
This codebase uses multiple API client libraries with inconsistent TypeScript definitions:
- `@redhat-cloud-services/rbac-client` - BROKEN TypeScript types, requires workarounds
- `@redhat-cloud-services/rbac-client/v2` (workspaces) - Working TypeScript types
- Other API clients - Varies by implementation

## Critical Rules

### 🚫 NEVER DO

#### 1. Add Explicit Defaults to rbac-client API Parameters
```typescript
// ❌ FORBIDDEN - Breaks rbac-client APIs
return await roleApi.listRoles(
  limit || 20,           // DON'T: Explicit defaults break the API
  offset || 0,           // DON'T: Force fallbacks
  name || '',            // DON'T: Empty string defaults
  scope || 'org_id',     // DON'T: String defaults
  {},                    // DON'T: Empty objects for rbac-client
);
```

#### 2. Access .data on Already Unwrapped Responses
```typescript
// ❌ FORBIDDEN - Double unwrapping due to responseInterceptor
const response = await api.someMethod();
if (response.data.length > 0) {           // DON'T: .data access on unwrapped response
  return response.data.map(...);          // DON'T: Already unwrapped by interceptor
}
```

#### 3. Use Forced Type Casting
```typescript
// ❌ FORBIDDEN - Masks real problems
return await roleApi.listRoles(
  limit as number,       // DON'T: Forces compilation but breaks runtime
  offset as number,      // DON'T: Doesn't fix underlying issues
  name as string,        // DON'T: Hides type problems
);
```

### ✅ MUST DO

#### 1. Check Original Master Implementation First
Always run: `git show master:src/helpers/[area]/[file]` before making changes

#### 2. Use Correct API Patterns

**For rbac-client APIs (groups, roles, users, policies, permissions):**
```typescript
export async function fetchSomething(params: SomeParams) {
  const { limit, offset, name } = params;
  
  // NOTE: @redhat-cloud-services/rbac-client has completely broken TypeScript types
  // - API expects undefined for optional parameters, not explicit defaults
  // - Using (apiMethod as any) to bypass broken type definitions
  return await (someApi.someMethod as any)(
    limit,          // undefined when not provided
    offset,         // undefined when not provided
    name,           // undefined when not provided
    undefined,      // options parameter - always undefined
  );
}
```

**For workspaces APIs (working types):**
```typescript
export async function workspaceMethod(config: WorkspaceParams) {
  return workspacesApi.someMethod(
    config.param1 ?? defaultValue,  // Use nullish coalescing
    config.param2 ?? 'default',     // Empty objects work correctly
    {},                             // Options parameter is fine
  );
}
```

#### 3. Handle Response Structures Correctly
```typescript
// For direct array responses (most rbac-client APIs)
const response = await api.listSomething();
return response.filter(item => item.someProperty);  // Direct access

// For mixed response types (like permissions)
if (Array.isArray(response)) {
  return { data: response.filter(...) };
} else {
  return { ...response, data: response.data.filter(...) };
}
```

#### 4. Add Required Comments for Workarounds
```typescript
// NOTE: @redhat-cloud-services/rbac-client has completely broken TypeScript types
// - [Specific issue description]
// - [Why this workaround is needed]
// - Using (apiMethod as any) to bypass broken type definitions
```

## Quick Reference

| API Client | Parameters | Options | Response Access | Type Handling |
|------------|------------|---------|----------------|---------------|
| `rbac-client` | `undefined` for optional | `undefined` | Direct (unwrapped) | `(api.method as any)` |
| `rbac-client/v2` | Use `??` defaults | `{}` objects | Direct (unwrapped) | Native types work |
| Others | Check master first | Varies | Test behavior | Follow original |

## Emergency Fix Checklist

When an API breaks after changes:

1. **Parameter defaults?** Remove `|| 20`, `|| ''`, `|| {}` - use `undefined`
2. **Response access?** Remove `.data` access if response already unwrapped
3. **Type assertions?** Use `(api.method as any)` not `param as type`
4. **Original behavior?** Check `git show master:path/to/helper`
5. **API client type?** rbac-client (broken) vs workspaces (working) vs other

## Enforcement

- All Redux helper changes MUST follow these patterns
- Any API parameter defaults in rbac-client calls should be flagged in code review
- Response `.data` access should be questioned and verified
- All `(api as any)` workarounds must include explanatory comments
- New API integrations must be tested against these patterns

## Rationale

These rules prevent runtime API failures that are hidden by TypeScript compilation. The @redhat-cloud-services/rbac-client library has fundamentally broken type definitions that don't match the actual API behavior, requiring careful workarounds to maintain functionality. 