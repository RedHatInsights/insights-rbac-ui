# Test Case Descriptions - test_users.py

**Source File:** `iqe_rbac_frontend/tests/test_users.py`
**Test Framework:** IQE (Widgetastic + Navmazing)
**Generated:** 2025-10-27

---

## Test Case 1: User Details Page Functionality

**Test Function:** `test_ui_rbac_user_details`
**Location:** `iqe_rbac_frontend/tests/test_users.py:10`
**Requirements:** RBAC_UI-ENTITIES
**Tags:** qa, core, itl

### Description
This test verifies that the user details page displays accurate role and group information for a user.

### Test Steps
1. **Navigate to User Details:** Open the details page for the currently logged-in user
2. **Verify Page Display:** Confirm the user details page is displayed correctly
3. **Fetch Role Data from API:** Retrieve the list of roles assigned to the user via API
4. **Verify Role Count:** Confirm that the total number of roles shown in the pagination matches the API response
5. **Verify Role Names:** Confirm that each role name displayed in the table matches a role from the API response
6. **Apply Search Filter:** Search for roles using a configured search string
7. **Verify Search Results:** Confirm the table still displays properly after filtering
8. **Expand Groups Section:** Click to expand the groups section for the first role in the table
9. **Verify Groups Expansion:** Confirm the groups section is expanded and the nested groups table is visible
10. **Collapse Groups Section:** Click to collapse the groups section
11. **Verify Groups Collapse:** Confirm the groups section is collapsed and the nested table is hidden
12. **Cleanup:** Clear any applied filters before ending the test

### Expected Results
- User details page displays correctly
- Role count in UI matches API response
- All role names in table match roles from API
- Search functionality filters roles correctly
- Groups section expands/collapses properly showing nested table

---

## Test Case 2: Organization Administrator Column Display

**Test Function:** `test_org_admin_column_users_table`
**Location:** `iqe_rbac_frontend/tests/test_users.py:54`
**Requirements:** RBAC_UI-ENTITIES, RBAC_UI-TABLES
**Tags:** qa, core
**Parameters:** `is_org_admin` - True (org_admin), False (non_org_admin)

### Description
This test verifies that the "Org. Administrator" column in the users table correctly displays "Yes" or "No" based on the user's organization administrator status.

### Test Steps
1. **Determine Test User:** Select either an org admin or non-org admin user based on test parameter
2. **Set Expected Value:** Set expected display value to "Yes" for org admin or "No" for non-org admin
3. **Navigate to Users Page:** Navigate to the page showing all users
4. **Search for User:** Apply search filter to find the specific test user
5. **Read Table Row:** Read the table row data for the target user
6. **Verify Org Admin Column:** Confirm the "Org. Administrator" column displays the expected value
7. **Cleanup:** Clear any applied filters before ending the test

### Expected Results
- When testing with org admin user: "Org. Administrator" column shows "Yes"
- When testing with non-org admin user: "Org. Administrator" column shows "No"

---

## Test Case 3: User Explorer Role Name Filtering

**Test Function:** `test_user_explorer_filter_by_role_name`
**Location:** `iqe_rbac_frontend/tests/test_users.py:99`
**Requirements:** RBAC_UI-ENTITIES, RBAC_UI-TABLES
**Tags:** qa, core

### Description
This test verifies that the user details page can filter roles by name and displays only matching results.

### Test Steps
1. **Navigate to User Details:** Open the details page for the currently logged-in user
2. **Verify Page Display:** Confirm the user details page is displayed correctly
3. **Apply Role Filter:** Search for roles containing "user_explorer" in their name
4. **Wait for Results:** Allow time for filter to apply (10 seconds)
5. **Collect Search Results:** Read all role names from the filtered table rows
6. **Verify Expected Roles:** Confirm all four expected user_explorer roles are present in search results:
   - user_explorer_role_1
   - user_explorer_role_2
   - user_explorer_role_3
   - user_explorer_role_4

### Expected Results
- Search filter correctly filters roles by name
- All four user_explorer roles appear in filtered results
- No other roles appear in results

---

## Test Case 4: Add User to Group Modal Opening

**Test Function:** `test_add_user_to_group_opens_modal`
**Location:** `iqe_rbac_frontend/tests/test_users.py:121`
**Requirements:** RBAC_UI-ENTITIES
**Tags:** qa, core

### Description
This test verifies that clicking the "Add user to a group" button opens and closes the expected modal dialog.

### Test Steps
1. **Navigate to User Details:** Open the details page for the currently logged-in user
2. **Verify Page Display:** Confirm the user details page is displayed correctly
3. **Click Add Button:** Click the "Add user to a group" button
4. **Verify Modal Opens:** Confirm the "Add User to Group" modal is displayed
5. **Click Cancel:** Click the "Cancel" button in the modal
6. **Verify Modal Closes:** Confirm the modal is no longer displayed

### Expected Results
- "Add user to a group" button is clickable
- Modal appears when button is clicked
- Modal closes when "Cancel" button is clicked

---

## Test Case 5: Add User to Group Modal Filters Existing Groups

**Test Function:** `test_add_user_to_group_only_lists_relevant_groups`
**Location:** `iqe_rbac_frontend/tests/test_users.py:143`
**Requirements:** RBAC_UI-ENTITIES, RBAC_UI-TABLES
**Tags:** qa, core

### Description
This test verifies that the "Add user to a group" modal only displays groups that the user is NOT already a member of.

### Test Steps
1. **Navigate to User Details:** Open the details page for the currently logged-in user
2. **Verify Page Display:** Confirm the user details page is displayed correctly
3. **Click Add Button:** Click the "Add user to a group" button
4. **Verify Modal Opens:** Confirm the "Add User to Group" modal is displayed
5. **Search for Existing Group:** Search for "user_explorer_group_2" (a group the user is already in)
6. **Wait for Results:** Allow time for search to complete (10 seconds)
7. **Collect Search Results:** Read all group names from the modal table
8. **Remove "No Results" Message:** Filter out the "no matching groups" message from results
9. **Verify Empty Results:** Confirm zero groups are displayed (since user is already a member)

### Expected Results
- Modal search functionality works correctly
- Groups that user is already a member of do NOT appear in the available groups list
- "No matching groups" message appears when searching for a group the user already belongs to

---

## Test Case 6: Org Admin Can Select Multiple Groups

**Test Function:** `test_org_admin_can_select_groups`
**Location:** `iqe_rbac_frontend/tests/test_users.py:169`
**Requirements:** RBAC_UI-ENTITIES, RBAC_UI-TABLES
**Tags:** qa, core

### Description
This test verifies that multiple groups can be selected via checkboxes in the "Add user to a group" modal.

### Test Steps
1. **Navigate to User Details:** Open the details page for the currently logged-in user
2. **Verify Page Display:** Confirm the user details page is displayed correctly
3. **Click Add Button:** Click the "Add user to a group" button
4. **Search for Groups:** Search for groups containing "user_explorer" in the modal search box
5. **Wait for Results:** Allow time for search to complete (10 seconds)
6. **Verify Groups Displayed:** Confirm "user_explorer_group_3" and "user_explorer_group_4" are both visible
7. **Select First Group:** Click the checkbox for "user_explorer_group_3"
8. **Select Second Group:** Click the checkbox for "user_explorer_group_4"
9. **Cancel Modal:** Click the "Cancel" button to close the modal

### Expected Results
- Modal displays available groups after search
- Multiple groups can be selected using checkboxes
- User can select at least two groups (user_explorer_group_3 and user_explorer_group_4)

---

## Test Data Requirements

### Pre-configured Groups
The following groups must exist in the test environment:
- user_explorer_group_2 (test user must be a member)
- user_explorer_group_3 (test user must NOT be a member)
- user_explorer_group_4 (test user must NOT be a member)

### Pre-configured Roles
The following roles must be assigned to the test user:
- user_explorer_role_1
- user_explorer_role_2
- user_explorer_role_3
- user_explorer_role_4

### User Accounts
- **Org Admin User:** `application.config.USERS.insights_qa`
- **Non-Org Admin User:** `application.rbac_frontend.config.USERS.non_org_admin_user`

---

## Framework Notes

### IQE/Widgetastic/Navmazing Patterns
- **Navigation:** `navigate_to(object, destination)` handles page navigation using Navmazing
- **Views:** Pages are represented as view objects (e.g., `UserDetailsPage`, `UsersPage`)
- **Widgets:** UI elements accessed via Widgetastic widgets:
  - `PatternflyTable` - Table interactions
  - `Button` - Button clicks
  - `TextInput` - Search/input fields
  - `CompoundExpandableTable` - Expandable/collapsible table rows
  - `Pagination` - Pagination controls
- **Verification:** Tests compare UI state against API responses for validation
- **State Checks:** Properties like `is_displayed`, `is_expanded` verify UI state

### Common Assertions
- `assert view.is_displayed` - Verifies page/component is visible
- `assert view.table.is_displayed` - Verifies table is rendered
- `view.table[0].groups.is_expanded` - Checks expansion state
- Comparing UI data with API responses for data accuracy
