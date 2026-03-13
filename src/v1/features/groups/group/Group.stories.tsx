import React from 'react';
import type { Meta, StoryFn, StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { waitForModal } from '../../../../test-utils/interactionHelpers';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Group } from './Group';
import { groupsErrorHandlers, groupsHandlers, groupsLoadingHandlers } from '../../../data/mocks/groups.handlers';
import type { GroupOut } from '../../../../shared/data/mocks/db';

const mockGroupData: GroupOut = {
  uuid: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Group',
  description: 'A test group for development',
  platform_default: false,
  system: false,
  admin_default: false,
  principalCount: 5,
  roleCount: 2,
  created: '2024-01-01T00:00:00Z',
  modified: '2024-01-02T00:00:00Z',
};

const mockSystemGroup: GroupOut = {
  uuid: 'system-group-uuid',
  name: 'Default access',
  description: 'System default group',
  platform_default: true,
  system: true,
  admin_default: false,
  principalCount: 0,
  roleCount: 0,
  created: '2023-01-01T00:00:00Z',
  modified: '2024-01-01T00:00:00Z',
};

const mockDefaultGroupModified: GroupOut = {
  uuid: 'modified-default-uuid',
  name: 'Modified Default Group',
  description: 'A modified default access group',
  platform_default: true,
  system: false,
  admin_default: false,
  principalCount: 0,
  roleCount: 0,
  created: '2023-01-01T00:00:00Z',
  modified: '2024-01-01T00:00:00Z',
};

// MemoryRouter avoids window.location pollution between stories in the test runner
const withRouter = (Story: StoryFn, context: { parameters?: { groupId?: string } }) => {
  const groupId = context.parameters?.groupId ?? '123e4567-e89b-12d3-a456-426614174000';
  return (
    <MemoryRouter initialEntries={[`/user-access/groups/${groupId}/roles`]}>
      <Routes>
        <Route
          path="/user-access/groups/:groupId/*"
          element={
            <div style={{ minHeight: '100vh' }}>
              <Story />
            </div>
          }
        />
      </Routes>
    </MemoryRouter>
  );
};

const meta: Meta<typeof Group> = {
  component: Group,
  tags: ['custom-css'], // NO autodocs on meta
  decorators: [withRouter],
  parameters: {},
};

export default meta;
type Story = StoryObj<typeof Group>;

// Only the default story gets autodocs
export const Default: Story = {
  tags: ['autodocs'], // ONLY story with autodocs
  parameters: {
    docs: {
      description: {
        story: `
**Default View**: Complete group container with normal group data and full functionality.

## Test Coverage

This container component manages group details display, navigation tabs, and actions. The stories test different group states and user interactions.

## Additional Test Stories

For testing specific scenarios, see these additional stories:

- **[LoadingState](?path=/story/features-groups-group--loading-state)**: Tests container during group loading
- **[SystemGroup](?path=/story/features-groups-group--system-group)**: Tests system/platform default group behavior  
- **[ModifiedDefaultGroup](?path=/story/features-groups-group--modified-default-group)**: Tests modified default group with restore functionality
- **[GroupNotFound](?path=/story/features-groups-group--group-not-found)**: Tests invalid group ID handling
- **[DropdownInteractions](?path=/story/features-groups-group--dropdown-interactions)**: Tests group actions dropdown menu
- **[TabNavigation](?path=/story/features-groups-group--tab-navigation)**: Tests tab switching functionality
        `,
      },
    },
    msw: {
      handlers: [...groupsHandlers([mockGroupData, mockSystemGroup])],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify initial render', async () => {
      // Test group name appears in header
      const header = await canvas.findByRole('heading', { name: 'Test Group' });
      expect(header).toBeInTheDocument();

      // Test description appears
      expect(await canvas.findByText('A test group for development')).toBeInTheDocument();

      // Test tabs are rendered
      expect(await canvas.findByText('Roles')).toBeInTheDocument();
      expect(await canvas.findByText('Members')).toBeInTheDocument();

      // Test actions dropdown exists for non-default groups
      const kebabButton = await canvas.findByRole('button', { name: /actions/i });
      expect(kebabButton).toBeInTheDocument();
    });
  },
};

export const LoadingState: Story = {
  parameters: {
    msw: {
      handlers: [...groupsLoadingHandlers()],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify loading skeleton', async () => {
      // Test skeleton loading state (standard pattern)
      await waitFor(
        () => {
          const skeletons = canvasElement.querySelectorAll('[class*="skeleton"]');
          expect(skeletons.length).toBeGreaterThan(0);
        },
        { timeout: 10000 },
      );
    });
  },
};

export const SystemGroup: Story = {
  parameters: {
    groupId: 'system-group-uuid',
    msw: {
      handlers: [...groupsHandlers([mockSystemGroup])],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify system group render', async () => {
      // Test system group name appears in header
      const header = await canvas.findByRole('heading', { name: 'Default access' });
      expect(header).toBeInTheDocument();

      // Test no actions dropdown for system groups
      const kebabButton = canvas.queryByRole('button', { name: /actions/i });
      expect(kebabButton).not.toBeInTheDocument();

      // Test tabs still work
      expect(await canvas.findByText('Roles')).toBeInTheDocument();
      expect(await canvas.findByText('Members')).toBeInTheDocument();
    });
  },
};

export const ModifiedDefaultGroup: Story = {
  parameters: {
    groupId: 'modified-default-uuid',
    msw: {
      handlers: [...groupsHandlers([mockDefaultGroupModified, mockSystemGroup])],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify modified default group', async () => {
      // Test modified default group shows special icon in header
      const header = await canvas.findByRole('heading', { name: mockDefaultGroupModified.name });
      expect(within(header).getByText(mockDefaultGroupModified.name)).toBeInTheDocument();

      // Test restore button appears for modified default groups
      expect(await canvas.findByText('Restore to default')).toBeInTheDocument();

      // Test no regular actions dropdown (has restore instead)
      const kebabButton = canvas.queryByRole('button', { name: /actions/i });
      expect(kebabButton).not.toBeInTheDocument();
    });
  },
};

export const GroupNotFound: Story = {
  parameters: {
    msw: {
      handlers: [...groupsHandlers([])],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify group not found error', async () => {
      // Wait for loading to complete and error state to appear
      await canvas.findByText('Group not found', {}, { timeout: 10000 });

      // Test error state content appears
      expect(await canvas.findByText('Group not found')).toBeInTheDocument();
      expect(await canvas.findByText(/Group with ID .* does not exist/i)).toBeInTheDocument();

      // Test back button appears
      expect(await canvas.findByRole('button', { name: /back to previous page/i })).toBeInTheDocument();
    });
  },
};

export const InvalidUuid: Story = {
  parameters: {
    msw: {
      handlers: [...groupsErrorHandlers(400)],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify invalid UUID error', async () => {
      // Wait for loading to complete and error state to appear
      await canvas.findByText('Group not found', {}, { timeout: 10000 });

      // Test error state content appears (same as GroupNotFound - both show same error UI)
      expect(await canvas.findByText('Group not found')).toBeInTheDocument();
      expect(await canvas.findByText(/Group with ID .* does not exist/i)).toBeInTheDocument();

      // Test back button appears
      expect(await canvas.findByRole('button', { name: /back to previous page/i })).toBeInTheDocument();
    });
  },
};

export const DropdownInteractions: Story = {
  parameters: {
    msw: {
      handlers: [...groupsHandlers([mockGroupData])],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Open dropdown and verify menu items', async () => {
      // Test dropdown opens
      const kebabButton = await canvas.findByRole('button', { name: /actions/i });
      expect(kebabButton).toBeInTheDocument();
      await userEvent.click(kebabButton);

      // Test dropdown items appear
      expect(await within(document.body).findByText('Edit')).toBeInTheDocument();
      expect(await within(document.body).findByText('Delete')).toBeInTheDocument();
    });
  },
};

export const TabNavigation: Story = {
  parameters: {
    msw: {
      handlers: [...groupsHandlers([mockGroupData])],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify tab navigation', async () => {
      // Test initial tab state
      expect(await canvas.findByText('Roles')).toBeInTheDocument();
      expect(await canvas.findByText('Members')).toBeInTheDocument();

      // Test Members tab - PatternFly tabs use div/button structure, not links
      const membersTab = await canvas.findByRole('tab', { name: 'Members' });
      expect(membersTab).toBeInTheDocument();
    });
  },
};

export const RestoreDefaultModal: Story = {
  parameters: {
    groupId: 'modified-default-uuid',
    msw: {
      handlers: [...groupsHandlers([mockDefaultGroupModified, mockSystemGroup])],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Open restore modal', async () => {
      // Click restore button
      const restoreButton = await canvas.findByText('Restore to default');
      await userEvent.click(restoreButton);

      // Modal should appear in document.body
      const modal = await waitForModal();
      expect(modal.getByText(/restore default access/i)).toBeInTheDocument();
      expect(modal.getByText(/continue/i)).toBeInTheDocument();
    });
  },
};
