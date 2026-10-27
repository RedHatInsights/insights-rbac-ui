import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { EditUserGroup } from '../../v2/features/users-and-user-groups/users-and-user-groups/user-groups/edit-user-group/EditUserGroup';
import { GroupDetailsServiceAccountsView } from '../../v2/features/users-and-user-groups/users-and-user-groups/user-groups/user-group-detail/GroupDetailsServiceAccountsView';
import { createV2MockDb } from '../../v2/data/mocks/db';
import { createV2Handlers } from '../../v2/data/mocks/handlers';
import { defaultV2Seed } from '../../v2/data/mocks/seed';
import { DEFAULT_GROUPS, DEFAULT_SERVICE_ACCOUNTS, SAT_SERVICE_ACCOUNT } from '../../shared/data/mocks/seed';
import { resetStoryState } from '../_shared/helpers/resetStoryState';
import { clearAndType, clickTab, selectTableRow } from '../../test-utils/interactionHelpers';
import { TEST_TIMEOUTS } from '../../test-utils/testUtils';

const TARGET_GROUP = DEFAULT_GROUPS.find((group) => !group.system && !group.admin_default && !group.platform_default)!;
const CREATED_GROUP_ID = 'sat-created-group';
const NEW_GROUP_NAME = 'Token automation group';
const EDIT_ROUTE = '/iam/access-management/users-and-user-groups/edit-group';
const CREATE_ROUTE = '/iam/access-management/users-and-user-groups/create-group';
const GROUPS_ROUTE = '/iam/access-management/users-and-user-groups/user-groups';
const db = createV2MockDb({
  ...defaultV2Seed(),
  serviceAccounts: [DEFAULT_SERVICE_ACCOUNTS[0], SAT_SERVICE_ACCOUNT],
  groupServiceAccounts: [[TARGET_GROUP.uuid, []]],
});
const addMembersSpy = fn();

function MembershipJourney({ createNewGroup = false }: { createNewGroup?: boolean }) {
  return (
    <MemoryRouter
      initialEntries={[createNewGroup ? CREATE_ROUTE : `${EDIT_ROUTE}/${TARGET_GROUP.uuid}`]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path={`${EDIT_ROUTE}/:groupId`} element={<EditUserGroup />} />
        <Route path={CREATE_ROUTE} element={<EditUserGroup createNewGroup />} />
        <Route
          path={GROUPS_ROUTE}
          element={<GroupDetailsServiceAccountsView groupId={createNewGroup ? CREATED_GROUP_ID : TARGET_GROUP.uuid} ouiaId="sat-membership-detail" />}
        />
      </Routes>
    </MemoryRouter>
  );
}

const meta: Meta<typeof MembershipJourney> = {
  component: MembershipJourney,
  title: 'User Journeys/Access Management/Service Access Token Membership',
  decorators: [
    (Story) => {
      db.reset();
      return <Story />;
    },
  ],
  parameters: {
    orgAdmin: true,
    permissions: ['rbac:*:*'],
    tenantPermissions: { rbac_groups_read: true, rbac_groups_write: true },
    featureFlags: { 'platform.service-accounts.sat': true },
    msw: { handlers: createV2Handlers(db, { groups: { uuidForNewGroup: CREATED_GROUP_ID }, groupMembers: { onAddMembers: addMembersSpy } }) },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const SaveAndReloadTokenMembership: Story = {
  tags: ['ff:platform.service-accounts.sat', 'perm:org-admin'],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    await step('Reset membership data', async () => {
      await resetStoryState(db);
      addMembersSpy.mockClear();
    });
    await step('Select a SAT alongside ordinary service accounts', async () => {
      await expect(canvas.findByRole('heading', { name: /edit user group/i })).resolves.toBeVisible();
      await clickTab(user, canvas, /service accounts/i);
      await expect(canvas.findByText('Token', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT })).resolves.toBeVisible();
      await expect(canvas.findByText(DEFAULT_SERVICE_ACCOUNTS[0].clientId)).resolves.toBeVisible();
      await selectTableRow(user, canvas, SAT_SERVICE_ACCOUNT.name);
    });
    await step('Save the original client ID to the real membership endpoint', async () => {
      const submit = await canvas.findByRole('button', { name: /submit|save/i });
      await waitFor(() => expect(submit).toBeEnabled());
      await user.click(submit);
      await waitFor(() =>
        expect(addMembersSpy).toHaveBeenCalledWith(TARGET_GROUP.uuid, {
          principals: [{ clientId: SAT_SERVICE_ACCOUNT.clientId, type: 'service-account' }],
        }),
      );
    });
    await step('Verify the saved token in group detail', async () => {
      await expect(canvas.findByLabelText('GroupServiceAccountsView')).resolves.toBeVisible();
      await expect(canvas.findByText('Token')).resolves.toBeVisible();
      await expect(canvas.findByText(`|service-account-${SAT_SERVICE_ACCOUNT.clientId}`)).resolves.toBeVisible();
      await expect(db.groupServiceAccounts.get(TARGET_GROUP.uuid)).toHaveLength(1);
    });
  },
};

export const CreateGroupWithToken: Story = {
  args: { createNewGroup: true },
  tags: ['ff:platform.service-accounts.sat', 'perm:org-admin'],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    await step('Reset membership data', async () => {
      await resetStoryState(db);
      addMembersSpy.mockClear();
    });
    await step('Name the group and select a service access token', async () => {
      const name = await canvas.findByRole('textbox', { name: /^name/i });
      await clearAndType(user, () => name as HTMLInputElement, NEW_GROUP_NAME);
      await clickTab(user, canvas, /service accounts/i);
      await expect(canvas.findByText('Token', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT })).resolves.toBeVisible();
      await selectTableRow(user, canvas, SAT_SERVICE_ACCOUNT.name);
    });
    await step('Create the group with a SAT principal', async () => {
      const submit = await canvas.findByRole('button', { name: /submit|save/i });
      await waitFor(() => expect(submit).toBeEnabled());
      await user.click(submit);
      await waitFor(() =>
        expect(addMembersSpy).toHaveBeenCalledWith(CREATED_GROUP_ID, {
          principals: [{ clientId: SAT_SERVICE_ACCOUNT.clientId, type: 'service-account' }],
        }),
      );
    });
    await step('Verify one saved token and its metadata', async () => {
      await expect(canvas.findByLabelText('GroupServiceAccountsView')).resolves.toBeVisible();
      await expect(canvas.findByText('Token')).resolves.toBeVisible();
      await expect(canvas.findByText(`|service-account-${SAT_SERVICE_ACCOUNT.clientId}`)).resolves.toBeVisible();
      await expect(db.groupServiceAccounts.get(CREATED_GROUP_ID)).toHaveLength(1);
    });
  },
};
