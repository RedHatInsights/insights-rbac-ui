/**
 * Shared helper functions for Access Management user journey tests
 *
 * These helpers provide consistent selectors and operations for:
 * - Users table interactions
 * - User groups table interactions
 * - Drawer operations and verification
 * - API spy setup and verification
 */

import { expect, within } from 'storybook/test';
import type { UserEvent } from '@testing-library/user-event';

// Canvas type is the return type of within()
type Canvas = ReturnType<typeof within>;

// =============================================================================
// TABLE SELECTORS
// =============================================================================

/**
 * Gets the Users table element
 */
export const getUsersTable = async (canvas: Canvas): Promise<HTMLElement> => {
  return canvas.findByRole('grid', { name: /users table/i });
};

/**
 * Gets the User Groups table element
 */
export const getUserGroupsTable = async (canvas: Canvas): Promise<HTMLElement> => {
  return canvas.findByRole('grid', { name: /user groups table/i });
};

// =============================================================================
// ROW OPERATIONS
// =============================================================================

/**
 * Finds a user row by username and returns the row element
 * Uses a flexible text matcher to handle text broken across multiple elements
 */
export const findUserRow = async (canvas: Canvas, username: string): Promise<HTMLTableRowElement> => {
  const table = await getUsersTable(canvas);
  const tableScope = within(table);
  // Use a function matcher to find the gridcell containing the username
  // This handles cases where text might be broken across multiple elements
  const userCell = await tableScope.findByRole('gridcell', { name: username });
  const row = userCell.closest('tr');
  expect(row).not.toBeNull();
  return row as HTMLTableRowElement;
};

/**
 * Finds a user group row by name and returns the row element
 * Uses findByText with a function matcher to handle text in table cells
 */
export const findGroupRow = async (canvas: Canvas, groupName: string): Promise<HTMLTableRowElement> => {
  const table = await getUserGroupsTable(canvas);
  const tableScope = within(table);
  // Use findByText to locate the group name text anywhere in the table
  // This is more reliable than findByRole for PatternFly table cells
  const groupText = await tableScope.findByText(groupName);
  const row = groupText.closest('tr');
  expect(row).not.toBeNull();
  return row as HTMLTableRowElement;
};

/**
 * Clicks on a user row to open the user details drawer
 */
export const openUserDrawer = async (canvas: Canvas, user: UserEvent, username: string): Promise<void> => {
  const row = await findUserRow(canvas, username);
  await user.click(row);
};

/**
 * Clicks on a group row to open the group details drawer
 */
export const openGroupDrawer = async (canvas: Canvas, user: UserEvent, groupName: string): Promise<void> => {
  const row = await findGroupRow(canvas, groupName);
  await user.click(row);
};

// =============================================================================
// DRAWER OPERATIONS
// =============================================================================

/**
 * Gets the drawer panel element (assumes it's open)
 * Uses PatternFly's drawer panel class selector
 */
export const getDrawerPanel = (canvasElement: HTMLElement): HTMLElement => {
  const drawer = canvasElement.querySelector('.pf-v6-c-drawer__panel') as HTMLElement;
  expect(drawer).not.toBeNull();
  return drawer;
};

/**
 * Gets the drawer scope for queries within the drawer
 */
export const getDrawerScope = (canvasElement: HTMLElement): Canvas => {
  const drawer = getDrawerPanel(canvasElement);
  return within(drawer);
};

/**
 * Waits for the drawer to open and returns its scope
 */
export const waitForDrawer = async (canvasElement: HTMLElement, timeout = 5000): Promise<Canvas> => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const drawer = canvasElement.querySelector('.pf-v6-c-drawer__panel') as HTMLElement;
    if (drawer && !drawer.hasAttribute('hidden')) {
      return within(drawer);
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Drawer did not open within timeout');
};

/**
 * Clicks a tab within the drawer
 */
export const clickDrawerTab = async (canvasElement: HTMLElement, user: UserEvent, tabName: RegExp | string): Promise<void> => {
  const drawerScope = getDrawerScope(canvasElement);
  const tab = await drawerScope.findByRole('tab', { name: tabName });
  await user.click(tab);
};

/**
 * Verifies the drawer header shows the expected name
 */
export const verifyDrawerHeader = async (canvasElement: HTMLElement, expectedName: string): Promise<void> => {
  const drawerScope = getDrawerScope(canvasElement);
  const heading = await drawerScope.findByRole('heading', { name: expectedName });
  expect(heading).toBeInTheDocument();
};

// =============================================================================
// USER DRAWER VERIFICATION
// =============================================================================

/**
 * Verifies user details in the drawer
 */
export const verifyUserDrawerDetails = async (
  canvasElement: HTMLElement,
  user: UserEvent,
  options: {
    username: string;
    checkGroupMembership?: { groupName: string; shouldBeMember: boolean }[];
  },
): Promise<void> => {
  const drawerScope = getDrawerScope(canvasElement);

  // Verify username is displayed
  await expect(drawerScope.findByText(options.username)).resolves.toBeInTheDocument();

  // Check group memberships if specified
  if (options.checkGroupMembership) {
    // Click on User Groups tab
    await clickDrawerTab(canvasElement, user, /user groups/i);

    for (const membership of options.checkGroupMembership) {
      if (membership.shouldBeMember) {
        await expect(drawerScope.findByText(membership.groupName)).resolves.toBeInTheDocument();
      } else {
        expect(drawerScope.queryByText(membership.groupName)).not.toBeInTheDocument();
      }
    }
  }
};

// =============================================================================
// GROUP DRAWER VERIFICATION
// =============================================================================

/**
 * Verifies group details in the drawer
 */
export const verifyGroupDrawerDetails = async (
  canvasElement: HTMLElement,
  user: UserEvent,
  options: {
    name: string;
    description?: string;
    checkUserMembership?: { username: string; shouldBeMember: boolean }[];
    checkRoles?: { roleName: string; shouldHaveRole: boolean }[];
  },
): Promise<void> => {
  const drawerScope = getDrawerScope(canvasElement);

  // Verify group name is displayed
  await expect(drawerScope.findByText(options.name)).resolves.toBeInTheDocument();

  // Verify description if specified
  if (options.description) {
    await expect(drawerScope.findByText(options.description)).resolves.toBeInTheDocument();
  }

  // Check user memberships if specified
  if (options.checkUserMembership) {
    await clickDrawerTab(canvasElement, user, /users/i);

    for (const membership of options.checkUserMembership) {
      if (membership.shouldBeMember) {
        await expect(drawerScope.findByText(membership.username)).resolves.toBeInTheDocument();
      } else {
        expect(drawerScope.queryByText(membership.username)).not.toBeInTheDocument();
      }
    }
  }

  // Check roles if specified
  if (options.checkRoles) {
    await clickDrawerTab(canvasElement, user, /roles/i);

    for (const role of options.checkRoles) {
      if (role.shouldHaveRole) {
        await expect(drawerScope.findByText(role.roleName)).resolves.toBeInTheDocument();
      } else {
        expect(drawerScope.queryByText(role.roleName)).not.toBeInTheDocument();
      }
    }
  }
};

// =============================================================================
// TAB NAVIGATION
// =============================================================================

/**
 * Clicks on the Users tab in the Users and User Groups page
 */
export const clickUsersTab = async (canvas: Canvas, user: UserEvent): Promise<void> => {
  const usersTab = await canvas.findByRole('tab', { name: /^users$/i });
  await user.click(usersTab);
};

/**
 * Clicks on the User Groups tab in the Users and User Groups page
 */
export const clickUserGroupsTab = async (canvas: Canvas, user: UserEvent): Promise<void> => {
  const groupsTab = await canvas.findByRole('tab', { name: /user groups/i });
  await user.click(groupsTab);
};

/**
 * Verifies the Users tab is selected
 */
export const verifyUsersTabSelected = async (canvas: Canvas): Promise<void> => {
  const usersTab = await canvas.findByRole('tab', { name: /^users$/i });
  expect(usersTab).toHaveAttribute('aria-selected', 'true');
};

/**
 * Verifies the User Groups tab is selected
 */
export const verifyUserGroupsTabSelected = async (canvas: Canvas): Promise<void> => {
  const groupsTab = await canvas.findByRole('tab', { name: /user groups/i });
  expect(groupsTab).toHaveAttribute('aria-selected', 'true');
};

// =============================================================================
// BUTTON HELPERS
// =============================================================================

/**
 * Clicks the "Create user group" button
 */
export const clickCreateUserGroupButton = async (canvas: Canvas, user: UserEvent): Promise<void> => {
  const button = await canvas.findByRole('button', { name: /create user group/i });
  await user.click(button);
};

/**
 * Clicks the "Add to user group" button (bulk action)
 */
export const clickAddToUserGroupButton = async (canvas: Canvas, user: UserEvent): Promise<void> => {
  const button = await canvas.findByRole('button', { name: /add to user group/i });
  await user.click(button);
};

/**
 * Clicks the form submit button
 */
export const clickSubmitButton = async (canvas: Canvas, user: UserEvent): Promise<void> => {
  const button = await canvas.findByRole('button', { name: /submit|create|save/i });
  await user.click(button);
};

/**
 * Clicks the form cancel button
 */
export const clickCancelButton = async (canvas: Canvas, user: UserEvent): Promise<void> => {
  const button = await canvas.findByRole('button', { name: /cancel/i });
  await user.click(button);
};

// =============================================================================
// FORM HELPERS
// =============================================================================

/**
 * Fills in the group name field
 */
export const fillGroupName = async (canvas: Canvas, user: UserEvent, name: string): Promise<void> => {
  const input = await canvas.findByLabelText(/name/i);
  await user.type(input, name);
};

/**
 * Fills in the group description field
 */
export const fillGroupDescription = async (canvas: Canvas, user: UserEvent, description: string): Promise<void> => {
  const input = await canvas.findByLabelText(/description/i);
  await user.type(input, description);
};

// =============================================================================
// SELECTION HELPERS
// =============================================================================

/**
 * Selects a user row by clicking its checkbox
 */
export const selectUserRow = async (canvas: Canvas, user: UserEvent, username: string): Promise<void> => {
  const row = await findUserRow(canvas, username);
  const checkbox = within(row).getByRole('checkbox');
  await user.click(checkbox);
};

/**
 * Selects a group row by clicking its checkbox
 */
export const selectGroupRow = async (canvas: Canvas, user: UserEvent, groupName: string): Promise<void> => {
  const row = await findGroupRow(canvas, groupName);
  const checkbox = within(row).getByRole('checkbox');
  await user.click(checkbox);
};

// =============================================================================
// API SPY VERIFICATION
// =============================================================================

/**
 * Verifies a create group API call was made with expected data
 */
export const verifyCreateGroupApiCall = (
  spy: ReturnType<typeof import('storybook/test').fn>,
  expected: { name: string; description?: string },
): void => {
  expect(spy).toHaveBeenCalledWith(
    expect.objectContaining({
      name: expected.name,
      ...(expected.description && { description: expected.description }),
    }),
  );
};

/**
 * Verifies an add members to group API call was made with expected data
 */
export const verifyAddMembersApiCall = (
  spy: ReturnType<typeof import('storybook/test').fn>,
  expected: { groupId: string; usernames: string[] },
): void => {
  expect(spy).toHaveBeenCalledWith({
    groupId: expected.groupId,
    principals: expected.usernames.map((username) => ({ username })),
  });
};

/**
 * Verifies no API calls were made to a spy
 */
export const verifyNoApiCalls = (spy: ReturnType<typeof import('storybook/test').fn>): void => {
  expect(spy).not.toHaveBeenCalled();
};

// =============================================================================
// ROLES TABLE HELPERS
// =============================================================================

/**
 * Gets the Roles table element
 */
export const getRolesTable = async (canvas: Canvas): Promise<HTMLElement> => {
  return canvas.findByRole('grid', { name: /roles/i });
};

/**
 * Finds a role row by name and returns the row element
 */
export const findRoleRow = async (canvas: Canvas, roleName: string): Promise<HTMLTableRowElement> => {
  const table = await getRolesTable(canvas);
  const tableScope = within(table);
  const roleText = await tableScope.findByText(roleName);
  const row = roleText.closest('tr');
  expect(row).not.toBeNull();
  return row as HTMLTableRowElement;
};

/**
 * Clicks on a role row to open the role details drawer
 */
export const openRoleDrawer = async (canvas: Canvas, user: UserEvent, roleName: string): Promise<void> => {
  const row = await findRoleRow(canvas, roleName);
  await user.click(row);
};

/**
 * Opens the kebab menu for a role row
 */
export const openRoleKebabMenu = async (canvas: Canvas, user: UserEvent, roleName: string): Promise<void> => {
  const row = await findRoleRow(canvas, roleName);
  const kebab = within(row).getByRole('button', { name: /actions/i });
  await user.click(kebab);
};

/**
 * Verifies a role exists in the table
 */
export const verifyRoleExists = async (canvas: Canvas, roleName: string): Promise<void> => {
  const table = await getRolesTable(canvas);
  const tableScope = within(table);
  await expect(tableScope.findByText(roleName)).resolves.toBeInTheDocument();
};

/**
 * Verifies a role does NOT exist in the table
 */
export const verifyRoleNotExists = async (canvas: Canvas, roleName: string): Promise<void> => {
  const table = await getRolesTable(canvas);
  const tableScope = within(table);
  expect(tableScope.queryByText(roleName)).not.toBeInTheDocument();
};

/**
 * Verifies a delete role API call was made with expected role ID
 */
export const verifyDeleteRoleApiCall = (spy: ReturnType<typeof import('storybook/test').fn>, expectedRoleId: string): void => {
  expect(spy).toHaveBeenCalledWith(expectedRoleId);
};

// =============================================================================
// MODAL HELPERS
// =============================================================================

/**
 * Gets the modal dialog element
 */
export const getModal = (): HTMLElement => {
  const modal = document.querySelector('[role="dialog"]') as HTMLElement;
  expect(modal).not.toBeNull();
  return modal;
};

/**
 * Gets the modal scope for queries within the modal
 */
export const getModalScope = (): Canvas => {
  const modal = getModal();
  return within(modal);
};

/**
 * Waits for a modal to appear
 */
export const waitForModal = async (timeout = 5000): Promise<Canvas> => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const modal = document.querySelector('[role="dialog"]') as HTMLElement;
    if (modal) {
      return within(modal);
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Modal did not appear within timeout');
};

/**
 * Clicks the confirmation checkbox in a modal
 */
export const clickModalCheckbox = async (user: UserEvent): Promise<void> => {
  const modalScope = getModalScope();
  const checkbox = await modalScope.findByRole('checkbox');
  await user.click(checkbox);
};

/**
 * Clicks the delete button in a modal
 */
export const clickModalDeleteButton = async (user: UserEvent): Promise<void> => {
  const modalScope = getModalScope();
  const deleteButton = await modalScope.findByRole('button', { name: /delete/i });
  await user.click(deleteButton);
};

/**
 * Clicks the cancel button in a modal
 */
export const clickModalCancelButton = async (user: UserEvent): Promise<void> => {
  const modalScope = getModalScope();
  const cancelButton = await modalScope.findByRole('button', { name: /cancel/i });
  await user.click(cancelButton);
};

/**
 * Verifies the delete button is disabled
 */
export const verifyDeleteButtonDisabled = async (): Promise<void> => {
  const modalScope = getModalScope();
  const deleteButton = await modalScope.findByRole('button', { name: /delete/i });
  expect(deleteButton).toBeDisabled();
};

/**
 * Verifies the delete button is enabled
 */
export const verifyDeleteButtonEnabled = async (): Promise<void> => {
  const modalScope = getModalScope();
  const deleteButton = await modalScope.findByRole('button', { name: /delete/i });
  expect(deleteButton).not.toBeDisabled();
};
