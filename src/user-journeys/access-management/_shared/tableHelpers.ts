/**
 * Shared helper functions for Access Management user journey tests
 *
 * These helpers provide consistent selectors and operations for:
 * - User groups table interactions
 * - Drawer operations
 * - Roles table interactions
 * - Modal operations
 * - API spy verification
 */

import { expect, waitFor, within } from 'storybook/test';
import type { UserEvent } from '@testing-library/user-event';
import { TEST_TIMEOUTS } from '../../_shared/helpers/testUtils';

// Canvas type is the return type of within()
type Canvas = ReturnType<typeof within>;

// =============================================================================
// TABLE SELECTORS
// =============================================================================

/**
 * Gets the User Groups table element
 */
export const getUserGroupsTable = async (canvas: Canvas): Promise<HTMLElement> => {
  return canvas.findByRole('grid', { name: /user groups table/i });
};

/**
 * Gets the Roles table element
 */
export const getRolesTable = async (canvas: Canvas): Promise<HTMLElement> => {
  return canvas.findByRole('grid', { name: /roles/i });
};

// =============================================================================
// ROW OPERATIONS
// =============================================================================

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
const getDrawerPanel = (canvasElement: HTMLElement): HTMLElement => {
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

// =============================================================================
// TAB NAVIGATION
// =============================================================================

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
// API SPY VERIFICATION
// =============================================================================

/**
 * Verifies no API calls were made to a spy
 */
export const verifyNoApiCalls = (spy: ReturnType<typeof import('storybook/test').fn>): void => {
  expect(spy).not.toHaveBeenCalled();
};

/**
 * Verifies a delete role API call was made with expected role ID
 */
export const verifyDeleteRoleApiCall = (spy: ReturnType<typeof import('storybook/test').fn>, expectedRoleId: string): void => {
  expect(spy).toHaveBeenCalledWith(expectedRoleId);
};

// =============================================================================
// ROLES TABLE HELPERS
// =============================================================================

/**
 * Verifies a role does NOT exist in the table
 */
export const verifyRoleNotExists = async (canvas: Canvas, roleName: string): Promise<void> => {
  await waitFor(
    () => {
      const table = canvas.queryByRole('grid', { name: /roles/i });
      if (table) {
        const tableScope = within(table);
        expect(tableScope.queryByText(roleName)).not.toBeInTheDocument();
      }
    },
    { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
  );
};

// =============================================================================
// MODAL HELPERS
// =============================================================================

/**
 * Gets the modal dialog element
 */
const getModal = (): HTMLElement => {
  const modal = document.querySelector('[role="dialog"]') as HTMLElement;
  expect(modal).not.toBeNull();
  return modal;
};

/**
 * Gets the modal scope for queries within the modal
 */
const getModalScope = (): Canvas => {
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
