# Groups Feature Restructuring - TODO

## Context & Background

### Current Problem Analysis
The `src/features/groups` feature violates multiple architectural principles:

**❌ Container/Component Violations:**
- Files using Redux (`useSelector`, `useDispatch`) contain massive amounts of PatternFly JSX
- True containers should have ZERO PatternFly imports - only Redux/API/navigation logic
- Current "containers" are actually monolithic UI components (280+ lines of JSX)

**❌ Islands Architecture Violations:**
- Mixed container and component responsibilities in same files
- Missing proper component/container separation per islands pattern
- Inconsistent export patterns (should be: containers = named+default, components = named only)

**❌ Table Architecture Issues:**
- 8 files use deprecated `TableToolbarView` component
- Need migration to modern `react-data-view` pattern (following myUserAccess example)
- Current table files will be completely rewritten, so documenting them is wasted effort

### Files Using TableToolbarView (Will Be Completely Replaced):
- `groups.js` - Main groups list table
- `add-group/users-list.js` - User selection table  
- `add-group/roles-list.js` - Role selection table
- `add-group/users-list-itless.js` - Alternative user list table
- `add-group/service-accounts-list.tsx` - Service account selection table
- `member/group-members.js` - Group members table
- `role/group-roles.js` - Group roles table  
- `service-account/group-service-accounts.js` - Service accounts table

### Pure Components (Will Survive Migration):
- ✅ `components/GroupHeader.tsx` - Pure component, receives all data via props
- ✅ `components/GroupSummary.tsx` - Pure component, no Redux/navigation
- ✅ `components/GroupRowWrapper.tsx` - Pure component, simple wrapper
- ✅ `components/DefaultInfoPopover.tsx` - Pure component with local state only
- ✅ `group-table-helpers.js` - Pure helper functions

## Strategy: Side-by-Side Development

Instead of rewriting in place, we'll:
1. Keep current implementation working
2. Build new implementation alongside it
3. Use stories to compare functionality and prove equivalence
4. Switch when confident in new implementation

## Phases

### Phase 1: Clean Up Components & Focus on Used Ones

#### Phase 1a: Remove Orphaned Components ✅ COMPLETE
- [x] DELETE `components/GroupHeader.tsx` - orphaned, only used in stories
- [x] DELETE `components/GroupHeader.stories.tsx` - orphaned component stories  
- [x] DELETE `components/GroupSummary.tsx` - orphaned, only used in stories
- [x] DELETE `components/GroupSummary.stories.tsx` - orphaned component stories

*Note: We'll recreate these as proper components when extracting logic from containers*

#### Phase 1b: Document Actually Used Components ✅ COMPLETE
- [x] Add stories to `components/GroupRowWrapper.tsx` ✅ USED in groups.js & add-user-to-group.js
- [x] Add stories to `components/DefaultServiceAccountsCard.tsx` ✅ USED in group-service-accounts.js  
- [x] Add stories to `components/DefaultMembersCard.tsx` ✅ USED in group-members.js
- [x] Add stories to `components/DefaultGroupChangedIcon.tsx` ✅ USED in group.js
- [x] Add stories to `components/DefaultGroupRestore.tsx` ✅ USED in group.js
- [x] Add stories to `components/DefaultInfoPopover.tsx` ✅ USED in group-table-helpers.js
- [x] Add stories to `components/GroupCreationSuccess.tsx` ✅ USED in add-group-success.tsx
- [x] Add stories to `components/DefaultGroupChangeModal.tsx` ✅ USED in add-group-roles.js, remove-role-modal.js
- [x] Verify all stories pass: `npm run test-storybook:ci --includeTags="groups"` ✅ 28 tests passed

**Goal:** Focus effort on components actually in production, eliminate dead code.

### Phase 2: Side-by-Side Implementation & Comparison

#### Phase 2a: Document Current Implementation ✅ COMPLETE
- [x] Create `groups.stories.tsx` for current `groups.js`
  - [x] Focus on API interactions (following AccessTable pattern)
  - [x] Test MSW handlers for `fetchGroups`, `fetchAdminGroup`, `fetchSystemGroup`
  - [x] Test filtering, sorting, pagination functionality
  - [x] Test row expansion (roles/members)
  - [x] Test selection and delete operations (admin users)
  - [x] Verify all interactions work with current TableToolbarView
  - [x] **BONUS: Complete testing of bulk actions, API parameter validation, comprehensive permissions**
  - [x] **Enhanced: Improved API interaction testing for expansion features**
  - [x] **Enhanced: Comprehensive toolbar actions disabled/enabled state testing (0 rows=both disabled, 1 row=both enabled, multiple rows=edit disabled/delete enabled)**
  - [x] **Enhanced: Fixed mock data for default groups (role counts, dates) and comprehensive default groups business logic testing**
- [x] **Follows single autodocs pattern**: Meta has no autodocs, only Default story has autodocs with comprehensive directory
- [x] **All 11 stories pass**: `npm run test-storybook:ci -- "groups.stories.tsx"` ✅

#### Phase 2b: Build New Implementation ✅ COMPLETE
- [x] Create new `Groups.tsx` container (following myUserAccess pattern)
  - [x] Use `react-data-view` components (`DataView`, `DataViewToolbar`, `DataViewFilters`)
  - [x] Custom table with compound expansion (following RolesTable pattern)
  - [x] Container has ZERO PatternFly table dependencies - only Redux/navigation logic
  - [x] Use `useDataViewFilters` for filter management
  - [x] Follow proper export pattern (named + default exports)
- [x] Create supporting TypeScript interfaces in `types.ts`
- [x] Extract pure components to `components/`:
  - [x] `GroupsTable.tsx` - Pure table component with compound expansion for roles/members
  - [x] `GroupActionsMenu.tsx` - Pure actions menu component
  - [x] `EmptyGroupsState.tsx` - Pure empty state component
- [x] ✅ **COMPILATION SUCCESSFUL** - All TypeScript errors resolved, build passes
- [x] ✅ **ROUTING INTEGRATION** - Added Outlet block with proper context for nested routes (add-group, edit-group, remove-group)
- [x] ✅ **ROUTING TESTS COMPLETE** - Added comprehensive testing for all 3 nested routes with mock components, context validation, and functional API testing
- [x] ✅ **STORIES COMPLETE** - `Groups.stories.tsx` with 24 passing tests (including 3 new routing tests)
  - [x] Updated selectors for react-data-view patterns (BulkSelect, DataView components)
  - [x] Updated filter selectors for DataViewFilters
  - [x] **API spies identical** - same MSW handlers, same API expectations
  - [x] **Functional equivalence verified** - comprehensive testing including bulk actions, expansion, filtering, sorting

#### Phase 2c: Extract Pure Components from Conversion ✅ COMPLETE
- [x] ✅ **MODAL EXTRACTION COMPLETE** - EditGroupModal.tsx and RemoveGroupModal.tsx extracted as pure TypeScript components
- [x] ✅ **COMPREHENSIVE STORIES** - Both modal components have complete Storybook stories with multiple variants
- [x] ✅ **RULES COMPLIANT** - Stories follow project guidelines (no custom titles, autodocs tags, proper imports)
- [x] ✅ **MODAL TESTING FIXED** - Fixed root cause: removed redundant `role="dialog"` from ModalFormTemplate (PatternFly Modal already provides this)
- [x] ✅ **ARCHITECTURE FIX** - Resolved duplicate dialog roles that violated accessibility best practices  
- [x] ✅ **FORM INTERACTION FIX** - Added `waitFor` to handle async form validation before button interactions
- [x] ✅ **TEXT MATCHING FIX** - Updated tests to use exact modal title text ("Edit group's information")
- [x] ✅ **LOADING STATE TESTS** - Added skeleton detection for LoadingState (`.pf-v5-c-skeleton`) and button disability for SubmittingState
- [x] ✅ **COMPONENT LIMITATION DOCUMENTED** - RemoveGroupModal loading state tests note that WarningModal doesn't support disabling interactions during loading
- [x] ✅ **BUILD SUCCESSFUL** - All TypeScript compilation and linting passes

### Phase 3: Apply Pattern to Sub-Features

#### Phase 3a: Members Sub-Feature
- [x] Create stories for existing `member/group-members.js` (document current behavior) ✅ COMPLETE
  - [x] ✅ **ALL 6 STORIES PASS** - Default, WithPermissions, Loading, EmptyState, DefaultAdminGroup, DefaultPlatformGroup, FilterMembers
  - [x] ✅ **REAL FILTERING TESTED** - FilterMembers story properly tests typing in filter input, API parameter validation, and filtered results
  - [x] ✅ **PERMISSION SCENARIOS** - Comprehensive testing of permission-dependent UI (interactive vs read-only modes)
  - [x] ✅ **EDGE CASES DOCUMENTED** - Empty states, loading states, default group behaviors properly captured
  - [x] ✅ **BUG DISCOVERED** - Component has dependency assumption bug: expects selectedGroup to be pre-populated but never calls fetchGroup(groupId), causing admin/platform default groups to show empty states instead of DefaultMembersCard when accessed directly
  - [x] ✅ **OUTLET TESTING ENHANCED** - Upgraded route testing to match Groups.stories.tsx functional testing pattern with API spy verification
- [x] ✅ **GROUP.TSX STORIES FIXED** - Fixed all Group.tsx component stories and Redux error handling
  - [x] ✅ **REDUX BUG FIXED** - Added missing `FETCH_GROUP_REJECTED` handler in reducer
  - [x] ✅ **ERROR HANDLING ENHANCED** - Fixed handleUuidError to handle both 404 (non-existent group) and 400 (malformed UUID) errors
  - [x] ✅ **COMPREHENSIVE ERROR TESTING** - Added stories for both GroupNotFound (404) and InvalidUuid (400) scenarios
  - [x] ✅ **ALL STORIES PASSING** - Group.tsx stories now pass: 13/13 tests including both error scenarios
  - [x] ✅ **STORYBOOK RULES APPLIED** - Fixed stories to follow all project rules (await delay(300), proper selectors, etc.)
- [ ] **CREATE NEW MODERN COMPONENT** - Replace group-members.js with react-data-view implementation
  - [ ] Create `members/GroupMembers.tsx` container following `.cursor/rules` and Groups.tsx pattern
    - [ ] **ZERO PatternFly imports** - only Redux, navigation, and business logic
    - [ ] Use `react-data-view` components (`DataView`, `DataViewTable`, `DataViewToolbar`) 
    - [ ] Follow Groups.tsx architecture exactly (same patterns, same structure)
    - [ ] **FIX DEPENDENCY BUG**: Call `fetchGroup(groupId)` on mount to load group details
    - [ ] Use `useDataViewFilters` for filter state management
    - [ ] Implement proper named + default exports pattern
    - [ ] **PRESERVE ALL FEATURES**: Bulk actions, filtering, pagination, row actions, permissions
    - [ ] **PRESERVE OUTLET CONTEXT**: Include all nested routes (edit-group, remove-group, add-members)
  - [ ] Create pure components in `members/components/`:
    - [ ] `GroupMembersTable.tsx` - Pure table component with PatternFly Table
    - [ ] `MemberActionsMenu.tsx` - Pure row actions menu component
    - [ ] `EmptyMembersState.tsx` - Pure empty state component (reuse existing or create new)
    - [ ] Keep existing `DefaultMembersCard.tsx` component (already pure)
  - [ ] Create TypeScript interfaces in `members/types.ts` for type safety
  - [ ] Ensure admin/platform default groups show `DefaultMembersCard` correctly (not empty states)
- [ ] **COPY AND UPDATE STORIES** - Migrate all existing test coverage to new component
  - [ ] Copy `GroupMembers.stories.tsx` to test new implementation
  - [ ] Update ALL selectors from TableToolbarView to react-data-view patterns:
    - [ ] Table grid: `role="grid"` → `[data-testid="data-view-table"]` or similar DataView patterns
    - [ ] Filter input: Update to DataViewFilters selectors
    - [ ] Toolbar actions: Update to DataViewToolbar selectors  
    - [ ] Bulk selection: Update to DataView bulk selection patterns
    - [ ] Row actions: Update to new GroupMembersTable action menu selectors
  - [ ] **PRESERVE ALL 15+ STORIES**: Default, WithPermissions, Loading, EmptyState, DefaultAdmin/Platform groups, FilterMembers, BulkSelection, ToolbarActions, RowActions, plus 3 route tests (EditGroupRoute, RemoveGroupRoute, AddMembersRoute)
  - [ ] **VERIFY FUNCTIONAL TESTING**: Ensure API spy testing (getMembersSpy, etc.) works with new implementation
  - [ ] **FIX FAILING TESTS**: Debug and resolve any selector mismatches until ALL tests pass
  - [ ] Run comprehensive test validation: `npm run test-storybook:ci -- "GroupMembers.stories.tsx"`
- [ ] **VERIFY API EQUIVALENCE** - Ensure new component has identical behavior to legacy
  - [ ] Same API calls with same parameters (group details, members list, filtering)
  - [ ] Same permission handling (orgAdmin vs userAccessAdministrator)
  - [ ] Same Redux state management patterns
  - [ ] Same MSW handler compatibility (no changes needed to existing mocks)
  - [ ] Same routing and navigation behavior

#### Phase 3b: Roles Sub-Feature  
- [ ] Create stories for existing `role/group-roles.js` (document current behavior)
- [ ] Create `roles/GroupRoles.tsx` container with react-data-view
- [ ] Copy stories to test new implementation, update selectors for react-data-view
- [ ] Extract pure components to `roles/components/`
- [ ] Verify API equivalence between old and new implementations

#### Phase 3c: Service Accounts Sub-Feature
- [x] ✅ **STORIES CREATED** - group-service-accounts.stories.tsx with working MSW handlers
  - [x] ✅ **BUG DISCOVERED DURING STORY CREATION**: Component has inconsistent API calling patterns causing race conditions
  - [x] ✅ **ROOT CAUSE IDENTIFIED**: Multiple API calls with different parameters - wrapper component calls with `serviceAccountClientIds: '*'` (correct) but main component calls without this parameter (incorrect), causing empty responses to overwrite service account data
  - [x] ✅ **STORY WORKAROUND APPLIED**: MSW handlers always return service accounts data to prevent race conditions in stories
  - [x] ✅ **ALL STORIES WORKING** - Fixed Loading story and cleaned up all MSW handlers for consistency
  - [x] ⚠️ **COMPONENT BUG TO FIX**: During TypeScript conversion, need to add `serviceAccountClientIds: '*'` to ALL service account API calls:
    - Line 76: `fetchData` callback - add `{ ...pagination, serviceAccountClientIds: '*' }`
    - Line 159: `TableToolbarView fetchData` prop - add `{ ...config, serviceAccountClientIds: '*' }`
    - This ensures ALL API calls request service accounts instead of users, preventing data race conditions
- [ ] Create `service-accounts/GroupServiceAccounts.tsx` container with react-data-view
- [ ] Copy stories to test new implementation, update selectors for react-data-view
- [ ] Extract pure components to `service-accounts/components/`
- [ ] **FIX COMPONENT BUG**: Ensure new implementation has consistent `serviceAccountClientIds: '*'` in all API calls
- [ ] Verify API equivalence between old and new implementations

#### Phase 3d: Add Group Sub-Feature
- [ ] Create stories for existing `add-group/add-group-wizard.js` and related table files (document current behavior)
- [ ] Create `add-group/AddGroup.tsx` container with react-data-view
- [ ] Copy stories to test new implementation, update selectors for react-data-view
- [ ] Replace multiple table files with single DataView implementation
- [ ] Extract pure components to `add-group/components/`
- [ ] Verify API equivalence between old and new implementations

### Phase 4: Final Architecture & Cleanup

#### Phase 4a: Router Integration
- [ ] Update routing to use new containers instead of old files
- [ ] Test all routes work with new implementation
- [ ] Verify breadcrumbs and navigation work correctly

#### Phase 4b: Remove Old Implementation
- [ ] Delete old `groups.js` (keep stories for reference)
- [ ] Delete all old TableToolbarView files:
  - [ ] `add-group/users-list.js`
  - [ ] `add-group/roles-list.js` 
  - [ ] `add-group/users-list-itless.js`
  - [ ] `add-group/service-accounts-list.tsx`
  - [ ] `member/group-members.js`
  - [ ] `role/group-roles.js`
  - [ ] `service-account/group-service-accounts.js`
- [ ] Remove unused helper files and table utilities
- [ ] Update import statements throughout codebase

#### Phase 4c: Final Verification
- [ ] Run full test suite: `npm test`
- [ ] Run Storybook tests: `npm run test-storybook:ci`
- [ ] Run build: `npm run build` 
- [ ] Run linting: `npm run lint:js`
- [ ] Manual testing of all group functionality

## Target Architecture

```
src/features/groups/
├── Groups.tsx                   # Main container (redux/nav only)
├── GroupDetail.tsx              # Group detail container
├── components/                  # Pure components only
│   ├── GroupHeader.tsx          # ✅ Already exists and pure
│   ├── GroupSummary.tsx         # ✅ Already exists and pure
│   ├── GroupRowWrapper.tsx      # ✅ Already exists and pure
│   ├── GroupActionsMenu.tsx     # Extract from containers
│   ├── GroupDeleteModal.tsx     # Pure modal component
│   ├── GroupEditModal.tsx       # Pure modal component
│   └── [other pure components]
├── add-group/
│   ├── AddGroup.tsx             # Container with DataView
│   └── components/              # Pure components for add-group
├── members/
│   ├── GroupMembers.tsx         # Container with DataView
│   └── components/              # Pure components for members
├── roles/
│   ├── GroupRoles.tsx           # Container with DataView
│   └── components/              # Pure components for roles
├── service-accounts/
│   ├── GroupServiceAccounts.tsx # Container with DataView
│   └── components/              # Pure components for service accounts
└── helpers/                     # Business logic helpers only
    ├── groupTableHelpers.ts     # ✅ Already good
    └── [other helpers]
```

## Key Principles to Follow

### Container Rules:
- [ ] Containers have ZERO PatternFly imports
- [ ] Only Redux (`useSelector`, `useDispatch`) and navigation hooks
- [ ] Use both named + default exports  
- [ ] Minimal JSX - just component calls with props

### Component Rules:
- [ ] Pure components only - no Redux, no navigation
- [ ] Handle i18n internally with `useIntl`
- [ ] Use named exports only (no default exports)
- [ ] Can use PatternFly components for UI

### React-Data-View Pattern:
- [ ] Use `DataView`, `DataViewTable`, `DataViewToolbar`
- [ ] Use `useDataViewFilters` for filter state
- [ ] Follow myUserAccess `AccessTable.tsx` as reference

## Resume Prompt for Future Sessions

```
Continue working on the Groups feature restructuring following the TODO.md plan. 

Current context:
- We're migrating from TableToolbarView to react-data-view
- Following islands architecture: proper container/component separation
- Containers should have ZERO PatternFly imports (Redux/navigation only)
- Using side-by-side development to ensure no regressions
- Following myUserAccess/AccessTable.tsx pattern for react-data-view

Check TODO.md for current progress and continue with the next unchecked item in the plan.
``` 