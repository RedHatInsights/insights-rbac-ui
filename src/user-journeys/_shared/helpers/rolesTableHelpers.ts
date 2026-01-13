import { expect, within } from 'storybook/test';
import type { UserEvent } from '@testing-library/user-event';

/**
 * Helper functions for testing the roles table, specifically for
 * expanding role rows and verifying "Add role to this group" link visibility.
 */

/**
 * Gets the table row element for a role link.
 */
export const getRoleRow = (roleLink: HTMLElement): HTMLTableRowElement => {
  const row = roleLink.closest('tr') as HTMLTableRowElement | null;
  expect(row).not.toBeNull();
  return row!;
};

/**
 * Gets the Groups toggle button in a role row.
 * The button shows the count of groups and expands to show the groups list.
 */
export const getGroupsToggleButton = (row: HTMLTableRowElement): HTMLElement => {
  const cell = row.querySelector('td[data-label="Groups"]') as HTMLElement | null;
  expect(cell).not.toBeNull();
  return within(cell!).getByRole('button');
};

/**
 * Gets the expanded row content (the next sibling row in expandable table pattern).
 */
export const getExpandedRowContent = (row: HTMLTableRowElement) => {
  const expandedRow = row.nextElementSibling as HTMLTableRowElement | null;
  expect(expandedRow).not.toBeNull();
  return within(expandedRow!);
};

/**
 * Gets the table row element for a group link in the expanded area.
 */
export const getGroupRow = (groupLink: HTMLElement): HTMLTableRowElement => {
  const row = groupLink.closest('tr') as HTMLTableRowElement | null;
  expect(row).not.toBeNull();
  return row!;
};

/**
 * Asserts that the "Add role to this group" link IS visible in the given row.
 */
export const expectAddRoleLinkVisible = (row: HTMLTableRowElement): void => {
  const link = within(row).queryByRole('link', { name: /add role to this group/i });
  expect(link).toBeInTheDocument();
};

/**
 * Asserts that the "Add role to this group" link is NOT visible in the given row.
 */
export const expectAddRoleLinkHidden = (row: HTMLTableRowElement): void => {
  const link = within(row).queryByRole('link', { name: /add role to this group/i });
  expect(link).not.toBeInTheDocument();
};

/**
 * Expands a role row by clicking its Groups toggle button.
 * Returns the scoped `within` object for the expanded content.
 */
export const expandRoleGroups = async (user: UserEvent, roleLink: HTMLElement) => {
  const roleRow = getRoleRow(roleLink);
  const groupsToggle = getGroupsToggleButton(roleRow);
  await user.click(groupsToggle);
  return {
    roleRow,
    groupsToggle,
    expandedContent: getExpandedRowContent(roleRow),
  };
};
