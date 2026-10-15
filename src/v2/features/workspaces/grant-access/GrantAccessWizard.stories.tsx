import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { GrantAccessWizard } from './GrantAccessWizard';
import { groupsHandlers } from '../../../../shared/data/mocks/groups.handlers';
import { groupMembersHandlers } from '../../../../shared/data/mocks/groupMembers.handlers';
import { v2RolesHandlers } from '../../../data/mocks/roles.handlers';
import { roleBindingsHandlers } from '../../../data/mocks/roleBindings.handlers';
import { waitForModal } from '../../../../test-utils/interactionHelpers';
import { TEST_TIMEOUTS } from '../../../../test-utils/testUtils';
import { GROUP_ADMIN_DEFAULT, GROUP_PLATFORM_ADMINS, GROUP_SUPPORT_TEAM, GROUP_SYSTEM_DEFAULT } from '../../../../shared/data/mocks/seed';
import {
  DEFAULT_V2_ROLES,
  MOCK_ORG_ID,
  ROLES_BY_RESOURCE_TYPE,
  V2_ROLE_TENANT_ADMIN,
  V2_ROLE_WORKSPACE_ADMIN,
  WS_PRODUCTION,
} from '../../../data/mocks/seed';
import type { Role } from '../../../data/mocks/db';

const TENANT_ADMIN_NAME = V2_ROLE_TENANT_ADMIN.name!;
const WORKSPACE_ADMIN_NAME = V2_ROLE_WORKSPACE_ADMIN.name!;

const WORKSPACE_NAME = WS_PRODUCTION.name!;
const WORKSPACE_ID = WS_PRODUCTION.id!;

const workspaceRoleIds = new Set(ROLES_BY_RESOURCE_TYPE.workspace);
const tenantRoleIds = new Set(ROLES_BY_RESOURCE_TYPE.tenant);

function rolesForResource(resourceType: string): Role[] | null {
  const ids = resourceType === 'workspace' ? workspaceRoleIds : resourceType === 'tenant' ? tenantRoleIds : null;
  if (!ids) return null;
  return DEFAULT_V2_ROLES.filter((r) => ids.has(r.id!));
}

const onCancelSpy = fn();
const afterSubmitSpy = fn();

const meta: Meta<typeof GrantAccessWizard> = {
  component: GrantAccessWizard,
  tags: ['autodocs'],
  args: {
    workspaceName: WORKSPACE_NAME,
    workspaceId: WORKSPACE_ID,
    onCancel: onCancelSpy,
    afterSubmit: afterSubmitSpy,
  },
  parameters: {
    msw: {
      handlers: [...groupsHandlers(), ...groupMembersHandlers({}, {}), ...v2RolesHandlers(), ...roleBindingsHandlers()],
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GrantAccessWizard>;

export const Default: Story = {
  play: async ({ step }) => {
    const user = userEvent.setup();

    await step('Wizard opens with groups step and Next disabled', async () => {
      const modal = await waitForModal();
      await expect(modal.findByText(new RegExp(`grant access in workspace ${WORKSPACE_NAME}`, 'i'))).resolves.toBeInTheDocument();

      await waitFor(
        () => {
          const nextBtn = modal.queryByRole('button', { name: /^next$/i });
          expect(nextBtn).toBeInTheDocument();
          expect(nextBtn).toBeDisabled();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });

    await step('Default groups are filtered out of selection', async () => {
      const modal = await waitForModal();
      expect(modal.queryByText(GROUP_ADMIN_DEFAULT.name)).not.toBeInTheDocument();
      expect(modal.queryByText(GROUP_SYSTEM_DEFAULT.name)).not.toBeInTheDocument();
    });

    await step('Select a group — Next becomes enabled', async () => {
      const modal = await waitForModal();
      const groupRow = await modal.findByText(GROUP_PLATFORM_ADMINS.name);
      const row = groupRow.closest('tr') as HTMLElement;
      const checkbox = within(row).getByRole('checkbox');
      await user.click(checkbox);

      await waitFor(
        () => {
          const nextBtn = modal.queryByRole('button', { name: /^next$/i });
          expect(nextBtn).toBeEnabled();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });

    await step('Deselect group — Next becomes disabled again', async () => {
      const modal = await waitForModal();
      const groupRow = await modal.findByText(GROUP_PLATFORM_ADMINS.name);
      const row = groupRow.closest('tr') as HTMLElement;
      const checkbox = within(row).getByRole('checkbox');
      await user.click(checkbox);

      await waitFor(
        () => {
          const nextBtn = modal.queryByRole('button', { name: /^next$/i });
          expect(nextBtn).toBeDisabled();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });

    await step('Re-select group and advance to roles step', async () => {
      const modal = await waitForModal();
      const groupRow = await modal.findByText(GROUP_PLATFORM_ADMINS.name);
      const row = groupRow.closest('tr') as HTMLElement;
      const checkbox = within(row).getByRole('checkbox');
      await user.click(checkbox);

      await waitFor(
        () => {
          const nextBtn = modal.queryByRole('button', { name: /^next$/i });
          expect(nextBtn).toBeEnabled();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );

      const nextBtn = modal.getByRole('button', { name: /^next$/i });
      await user.click(nextBtn);

      await expect(modal.findByRole('heading', { name: /select role\(s\)/i })).resolves.toBeInTheDocument();
    });

    await step('Roles step — Next disabled until a role is selected', async () => {
      const modal = await waitForModal();

      await waitFor(
        () => {
          const nextBtn = modal.queryByRole('button', { name: /^next$/i });
          expect(nextBtn).toBeInTheDocument();
          expect(nextBtn).toBeDisabled();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );

      const roleRow = await modal.findByText(TENANT_ADMIN_NAME);
      const row = roleRow.closest('tr') as HTMLElement;
      const checkbox = within(row).getByRole('checkbox');
      await user.click(checkbox);

      await waitFor(
        () => {
          const nextBtn = modal.queryByRole('button', { name: /^next$/i });
          expect(nextBtn).toBeEnabled();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });

    await step('Advance to review step and verify selections', async () => {
      const modal = await waitForModal();
      const nextBtn = modal.getByRole('button', { name: /^next$/i });
      await user.click(nextBtn);

      await expect(modal.findByText(GROUP_PLATFORM_ADMINS.name)).resolves.toBeInTheDocument();
      await expect(modal.findByText(TENANT_ADMIN_NAME)).resolves.toBeInTheDocument();
    });
  },
};

export const MultipleSelections: Story = {
  name: 'Multiple groups and roles',
  play: async ({ step }) => {
    const user = userEvent.setup();

    await step('Select two groups and advance', async () => {
      const modal = await waitForModal();

      await waitFor(
        () => {
          expect(modal.queryByText(GROUP_PLATFORM_ADMINS.name)).toBeInTheDocument();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );

      const group1Row = (await modal.findByText(GROUP_PLATFORM_ADMINS.name)).closest('tr') as HTMLElement;
      await user.click(within(group1Row).getByRole('checkbox'));

      const group2Row = (await modal.findByText(GROUP_SUPPORT_TEAM.name)).closest('tr') as HTMLElement;
      await user.click(within(group2Row).getByRole('checkbox'));

      await waitFor(() => {
        expect(modal.queryByRole('button', { name: /^next$/i })).toBeEnabled();
      });

      await user.click(modal.getByRole('button', { name: /^next$/i }));
      await expect(modal.findByRole('heading', { name: /select role\(s\)/i })).resolves.toBeInTheDocument();
    });

    await step('Select two roles and advance to review', async () => {
      const modal = await waitForModal();

      const role1Row = (await modal.findByText(TENANT_ADMIN_NAME)).closest('tr') as HTMLElement;
      await user.click(within(role1Row).getByRole('checkbox'));

      const role2Row = (await modal.findByText(WORKSPACE_ADMIN_NAME)).closest('tr') as HTMLElement;
      await user.click(within(role2Row).getByRole('checkbox'));

      await waitFor(() => {
        expect(modal.queryByRole('button', { name: /^next$/i })).toBeEnabled();
      });

      await user.click(modal.getByRole('button', { name: /^next$/i }));
    });

    await step('Review shows all selections', async () => {
      const modal = await waitForModal();
      await expect(modal.findByText(GROUP_PLATFORM_ADMINS.name)).resolves.toBeInTheDocument();
      await expect(modal.findByText(GROUP_SUPPORT_TEAM.name)).resolves.toBeInTheDocument();
      await expect(modal.findByText(TENANT_ADMIN_NAME)).resolves.toBeInTheDocument();
      await expect(modal.findByText(WORKSPACE_ADMIN_NAME)).resolves.toBeInTheDocument();
    });
  },
};

export const CancelWizard: Story = {
  name: 'Cancel dismisses wizard',
  play: async ({ step }) => {
    const user = userEvent.setup();

    await step('Click cancel on groups step', async () => {
      const modal = await waitForModal();
      await expect(modal.findByText(new RegExp(`grant access in workspace ${WORKSPACE_NAME}`, 'i'))).resolves.toBeInTheDocument();

      const cancelBtn = await modal.findByRole('button', { name: /^cancel$/i });
      await user.click(cancelBtn);

      await waitFor(() => expect(onCancelSpy).toHaveBeenCalled());
    });
  },
};

const onListSpy = fn();

export const WorkspaceScoped: Story = {
  name: 'Workspace-scoped roles only',
  args: {
    resourceType: 'workspace',
  },
  parameters: {
    msw: {
      handlers: [
        ...groupsHandlers(),
        ...groupMembersHandlers({}, {}),
        ...v2RolesHandlers(undefined, { onList: onListSpy, rolesForResource: (rt) => rolesForResource(rt) }),
        ...roleBindingsHandlers(),
      ],
    },
  },
  play: async ({ step }) => {
    const user = userEvent.setup();
    onListSpy.mockClear();

    await step('Select a group and advance to roles step', async () => {
      const modal = await waitForModal();
      const groupRow = await modal.findByText(GROUP_PLATFORM_ADMINS.name);
      const row = groupRow.closest('tr') as HTMLElement;
      await user.click(within(row).getByRole('checkbox'));

      await waitFor(() => {
        expect(modal.queryByRole('button', { name: /^next$/i })).toBeEnabled();
      });
      await user.click(modal.getByRole('button', { name: /^next$/i }));
      await expect(modal.findByRole('heading', { name: /select role\(s\)/i })).resolves.toBeInTheDocument();
    });

    await step('Only workspace-level roles are shown', async () => {
      const modal = await waitForModal();
      await expect(modal.findByText(WORKSPACE_ADMIN_NAME)).resolves.toBeInTheDocument();
      expect(modal.queryByText(TENANT_ADMIN_NAME)).not.toBeInTheDocument();
    });

    await step('API was called with resource_type=workspace', async () => {
      await waitFor(() => {
        expect(onListSpy).toHaveBeenCalled();
        const params = onListSpy.mock.calls[0][0] as URLSearchParams;
        expect(params.get('resource_type')).toBe('workspace');
        expect(params.get('resource_id')).toBe(WORKSPACE_ID);
      });
    });
  },
};

export const TenantScoped: Story = {
  name: 'Tenant-scoped roles (org-level grant)',
  args: {
    workspaceName: 'Organization',
    workspaceId: `redhat/${MOCK_ORG_ID}`,
    resourceType: 'tenant',
  },
  parameters: {
    msw: {
      handlers: [
        ...groupsHandlers(),
        ...groupMembersHandlers({}, {}),
        ...v2RolesHandlers(undefined, { onList: onListSpy, rolesForResource: (rt) => rolesForResource(rt) }),
        ...roleBindingsHandlers(),
      ],
    },
  },
  play: async ({ step }) => {
    const user = userEvent.setup();
    onListSpy.mockClear();

    await step('Wizard title shows org-level grant', async () => {
      const modal = await waitForModal();
      await expect(modal.findByText(/grant access in organization/i)).resolves.toBeInTheDocument();
    });

    await step('Select a group and advance to roles step', async () => {
      const modal = await waitForModal();
      const groupRow = await modal.findByText(GROUP_PLATFORM_ADMINS.name);
      const row = groupRow.closest('tr') as HTMLElement;
      await user.click(within(row).getByRole('checkbox'));

      await waitFor(() => {
        expect(modal.queryByRole('button', { name: /^next$/i })).toBeEnabled();
      });
      await user.click(modal.getByRole('button', { name: /^next$/i }));
      await expect(modal.findByRole('heading', { name: /select role\(s\)/i })).resolves.toBeInTheDocument();
    });

    await step('Only tenant-level roles are shown', async () => {
      const modal = await waitForModal();
      await expect(modal.findByText(TENANT_ADMIN_NAME)).resolves.toBeInTheDocument();
      expect(modal.queryByText(WORKSPACE_ADMIN_NAME)).not.toBeInTheDocument();
    });

    await step('API was called with resource_type=tenant', async () => {
      await waitFor(() => {
        expect(onListSpy).toHaveBeenCalled();
        const params = onListSpy.mock.calls[0][0] as URLSearchParams;
        expect(params.get('resource_type')).toBe('tenant');
        expect(params.get('resource_id')).toBe(`redhat/${MOCK_ORG_ID}`);
      });
    });
  },
};
