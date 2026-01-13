# Investigation: "Add role to this group" Link Logic

## Context

In the RBAC UI, when viewing the Roles list and expanding a role to see its assigned groups, there's an "Add role to this group" link that appears for each group. The current implementation hides this link for the "admin group" (Default Admin Access group).

## Current Implementation

**Location:** `src/features/roles/Roles.tsx` (line 81) and `src/features/roles/components/RolesTable.tsx`

The logic:

```typescript
{adminGroup?.uuid !== group.uuid && (
  <AppLink to={pathnames['roles-add-group-roles'].link...}>
    Add role to this group
  </AppLink>
)}
```

The `adminGroup` is fetched via: `GET /api/rbac/v1/groups/?admin_default=true&limit=1`

## Questions to Investigate

1. **What is the business logic?** Why hide "Add role to this group" for the admin group?
   - Admin group already has all roles?
   - Admin group roles can't be modified?
   - Something else?

2. **Is this the right check?** Should we be checking:
   - The group's `admin_default` property instead of comparing UUIDs?
   - The group's `platform_default` property?
   - User permissions to modify the group?

3. **Edge cases:**
   - What if `adminGroup` query fails/loading? (Link shows for ALL groups - bug?)
   - What if there are multiple admin groups?
   - What about "Default Access" group (non-admin platform default)?

4. **Does the route even work?** Verify `roles-add-group-roles` exists and functions.

## Files to Review

- `src/features/roles/Roles.tsx` - GroupsTable component
- `src/features/roles/components/RolesTable.tsx` - Similar GroupsTable
- `src/data/queries/groups.ts` - useAdminGroupQuery
- `src/utilities/pathnames.ts` - Check roles-add-group-roles route
- `src/features/groups/` - How group role assignment works

## Existing Tests

- `src/features/users/User.stories.tsx` - checks link appears for non-admin groups
- `src/features/roles/components/RolesTable.stories.tsx` - tests GroupsTable but NOT link visibility
