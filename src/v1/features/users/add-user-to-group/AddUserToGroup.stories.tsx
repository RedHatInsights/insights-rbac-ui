import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { BrowserRouter } from 'react-router-dom';
import { AddUserToGroup } from './AddUserToGroup';
import { groupsHandlers, groupsLoadingHandlers } from '../../../../shared/data/mocks/groups.handlers';
import type { GroupOut } from '../../../../shared/data/mocks/db';
import { groupMembersHandlers } from '../../../../shared/data/mocks/groupMembers.handlers';

// API call spies
const fetchGroupsSpy = fn();
const addMembersToGroupSpy = fn();

// Mock groups data
const mockGroups = [
  {
    uuid: 'group-1',
    name: 'Administrators',
    description: 'System administrators group',
    platform_default: false,
    admin_default: false,
    roleCount: 3,
    principalCount: 5,
  },
  {
    uuid: 'group-2',
    name: 'Platform Team',
    description: 'Platform engineering team',
    platform_default: false,
    admin_default: false,
    roleCount: 2,
    principalCount: 8,
  },
  {
    uuid: 'group-3',
    name: 'Finance Team',
    description: 'Finance and accounting',
    platform_default: false,
    admin_default: false,
    roleCount: 1,
    principalCount: 12,
  },
];

// Router decorator - renders the component directly to support username prop
const withRouter = (_Story: React.ComponentType, context: { args: { username?: string } }) => {
  const username = context.args?.username || 'john.doe';
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh' }}>
        <AddUserToGroup username={username} />
      </div>
    </BrowserRouter>
  );
};

// Helper to create default MSW handlers
const createDefaultHandlers = (groups = mockGroups) => [
  ...groupsHandlers(groups as unknown as GroupOut[], {
    onList: (params) =>
      fetchGroupsSpy({
        name: params?.get?.('name'),
        limit: parseInt(params?.get?.('limit') ?? '10'),
        offset: parseInt(params?.get?.('offset') ?? '0'),
      }),
  }),
  ...groupMembersHandlers(
    {},
    {},
    {
      onAddMembers: (groupId, body) =>
        addMembersToGroupSpy({ groupId, principals: (body as { principals: Array<{ username: string }> }).principals }),
    },
  ),
];

const meta: Meta<typeof AddUserToGroup> = {
  component: AddUserToGroup,
  tags: ['add-user-to-group', 'custom-css'],
  decorators: [withRouter],
  args: {
    username: 'john.doe',
  },
  parameters: {
    layout: 'fullscreen',
  },
  beforeEach: () => {
    fetchGroupsSpy.mockClear();
    addMembersToGroupSpy.mockClear();
  },
};

export default meta;
type Story = StoryObj<typeof AddUserToGroup>;

// Helper to get modal content (Modal uses portal, renders outside canvasElement)
const getModalBody = () => within(document.body);

export const Default: Story = {
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
**Default View**: Modal displaying available groups to add the user to.

## Test Coverage

- Modal renders with title "Add john.doe to a group"
- Info alert about only showing non-user groups
- Table of available groups
- Save and Cancel buttons
        `,
      },
    },
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ step }) => {
    const body = getModalBody();

    await step('Verify modal and groups table', async () => {
      // Wait for modal to appear
      await body.findByRole('dialog', {}, { timeout: 5000 });

      // Wait for groups table to load (or show empty state)
      // Verify groups table loaded (groups are visible)
      expect(await body.findByText('Administrators', {}, { timeout: 5000 })).toBeInTheDocument();

      // Verify Save button exists and is disabled (no selection)
      // Note: Button has aria-label="Save" which overrides the visible text
      const saveButtons = body.getAllByRole('button', { name: /save/i });
      expect(saveButtons.length).toBeGreaterThan(0);
      expect(saveButtons[0]).toBeDisabled();

      // Verify Cancel button exists
      const cancelButtons = body.getAllByRole('button', { name: /cancel/i });
      expect(cancelButtons.length).toBeGreaterThan(0);
    });
  },
};

export const SelectGroupAndSave: Story = {
  tags: ['perm:org-admin'],
  parameters: {
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ step }) => {
    const body = getModalBody();

    await step('Select group and verify save enabled', async () => {
      // Wait for modal and groups to load
      expect(await body.findByText('Administrators', {}, { timeout: 5000 })).toBeInTheDocument();

      // Find checkboxes - admin users can select groups
      const checkboxes = body.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);

      // Click first group checkbox (skip header checkbox)
      await userEvent.click(checkboxes[1]);

      // Save button should now be enabled
      await waitFor(() => {
        const saveButtons = body.getAllByRole('button', { name: /save/i });
        expect(saveButtons[0]).not.toBeDisabled();
      });
      const saveButtons = body.getAllByRole('button', { name: /save/i });
      expect(saveButtons.length).toBeGreaterThan(0);
      expect(saveButtons[0]).not.toBeDisabled();
    });
  },
};

export const CancelWithChangesShowsWarning: Story = {
  tags: ['perm:org-admin'],
  parameters: {
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ step }) => {
    const body = getModalBody();

    await step('Select group and cancel to show warning', async () => {
      // Wait for groups to load
      expect(await body.findByText('Administrators', {}, { timeout: 5000 })).toBeInTheDocument();

      // Select a group
      const checkboxes = body.getAllByRole('checkbox');
      await userEvent.click(checkboxes[1]);

      // Click cancel - should show warning modal
      const cancelButton = await body.findByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);

      // Warning modal should appear with discard button
      await waitFor(
        async () => {
          const discardButton = body.queryByRole('button', { name: /discard/i });
          expect(discardButton).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });
  },
};

export const Loading: Story = {
  parameters: {
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: groupsLoadingHandlers(),
    },
  },
  play: async ({ step }) => {
    const body = getModalBody();

    await step('Verify loading modal', async () => {
      // Wait for modal to appear (loading handlers never resolve, so we see skeleton)
      expect(await body.findByRole('dialog', {}, { timeout: 5000 })).toBeInTheDocument();
    });
  },
};

export const EmptyGroups: Story = {
  parameters: {
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: groupsHandlers([]),
    },
  },
  play: async ({ step }) => {
    const body = getModalBody();

    await step('Verify empty groups state', async () => {
      expect(await body.findByRole('dialog', {}, { timeout: 5000 })).toBeInTheDocument();
      expect(await body.findByText(/no groups/i, {}, { timeout: 3000 })).toBeInTheDocument();
    });
  },
};
