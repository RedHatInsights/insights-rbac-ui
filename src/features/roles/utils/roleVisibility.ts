/**
 * Determines whether the "Add role to this group" link should be shown.
 *
 * The link should be hidden when:
 * - adminGroup is undefined (still loading) - prevents flash of incorrect UI
 * - group.uuid is undefined (invalid group data)
 * - the group IS the admin group (admin group cannot have roles added via this UI)
 *
 * @param adminGroup - The admin group, or undefined if still loading
 * @param group - The group to check
 * @returns true if the "Add role to this group" link should be shown
 */
export const shouldShowAddRoleToGroupLink = (adminGroup: { uuid?: string } | undefined | null, group: { uuid?: string | null }): boolean => {
  return !!adminGroup?.uuid && !!group.uuid && adminGroup.uuid !== group.uuid;
};
