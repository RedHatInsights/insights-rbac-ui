import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, http } from 'msw';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Group } from './Group';

const mockGroupData = {
  uuid: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Group',
  description: 'A test group for development',
  platform_default: false,
  system: false,
  admin_default: false,
  principalCount: 5,
  policyCount: 3,
  roleCount: 2,
};

const mockSystemGroup = {
  uuid: 'system-group-uuid',
  name: 'Default access',
  description: 'System default group',
  platform_default: true,
  system: true,
  admin_default: false,
};

const mockDefaultGroupModified = {
  uuid: 'modified-default-uuid',
  name: 'Modified Default Group',
  description: 'A modified default access group',
  platform_default: true,
  system: false,
  admin_default: false,
};

// Minimal decorator - only provide Router (Redux provider is global)
const withRouter = (Story: any) => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/groups/:groupId/*"
          element={
            <div style={{ minHeight: '100vh' }}>
              <Story />
            </div>
          }
        />
        <Route path="*" element={<Navigate to="/groups/123e4567-e89b-12d3-a456-426614174000/roles" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

const meta: Meta<typeof Group> = {
  component: Group,
  tags: ['group-container'], // NO autodocs on meta
  decorators: [withRouter],
  parameters: {
    layout: 'fullscreen',
  },
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
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/', () => HttpResponse.json(mockGroupData)),
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          const name = url.searchParams.get('name');
          if (name === 'Default access') {
            return HttpResponse.json({
              data: [mockSystemGroup],
              meta: { count: 1 },
            });
          }
          return HttpResponse.json({
            data: [],
            meta: { count: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test group name appears
    expect(await canvas.findByText('Test Group')).toBeInTheDocument();

    // Test description appears
    expect(await canvas.findByText('A test group for development')).toBeInTheDocument();

    // Test tabs are rendered
    expect(await canvas.findByText('Roles')).toBeInTheDocument();
    expect(await canvas.findByText('Members')).toBeInTheDocument();

    // Test actions dropdown exists for non-default groups
    const kebabButton = await canvas.findByLabelText(/group-actions-dropdown/i);
    expect(kebabButton).toBeInTheDocument();
  },
};

export const LoadingState: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/', () => new Promise(() => {})), // Never resolves
        http.get('/api/rbac/v1/groups/', () => new Promise(() => {})),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await waitFor(
      async () => {
        const skeletonElements = canvasElement.querySelectorAll('[class*="skeleton"]');
        expect(skeletonElements.length).toBeGreaterThan(0);
      },
      { timeout: 10000 },
    );
  },
};

export const SystemGroup: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/', () => HttpResponse.json(mockSystemGroup)),
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          const name = url.searchParams.get('name');
          if (name === 'Default access') {
            return HttpResponse.json({
              data: [mockSystemGroup],
              meta: { count: 1 },
            });
          }
          return HttpResponse.json({ data: [], meta: { count: 0 } });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test system group name appears
    expect(await canvas.findByText('Default access')).toBeInTheDocument();

    // Test no actions dropdown for system groups
    expect(canvas.queryByLabelText(/group-actions-dropdown/i)).not.toBeInTheDocument();

    // Test tabs still work
    expect(await canvas.findByText('Roles')).toBeInTheDocument();
    expect(await canvas.findByText('Members')).toBeInTheDocument();
  },
};

export const ModifiedDefaultGroup: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/', () => HttpResponse.json(mockDefaultGroupModified)),
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          const name = url.searchParams.get('name');
          if (name === 'Default access') {
            return HttpResponse.json({
              data: [{ uuid: 'system-group-uuid' }],
              meta: { count: 1 },
            });
          }
          return HttpResponse.json({ data: [], meta: { count: 0 } });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test modified default group shows special icon
    expect(await canvas.findByText('Modified Default Group')).toBeInTheDocument();

    // Test restore button appears for modified default groups
    expect(await canvas.findByText(/restore default access/i)).toBeInTheDocument();

    // Test no regular actions dropdown (has restore instead)
    expect(canvas.queryByLabelText(/group-actions-dropdown/i)).not.toBeInTheDocument();
  },
};

export const GroupNotFound: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/', () => HttpResponse.json({ message: 'Group not found' }, { status: 404 })),
        http.get('/api/rbac/v1/groups/', () => HttpResponse.json({ data: [], meta: { count: 0 } })),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test error state shows
    expect(await canvas.findByText(/group not found/i)).toBeInTheDocument();
    expect(await canvas.findByText(/group does not exist/i)).toBeInTheDocument();

    // Test back button appears
    expect(await canvas.findByText(/back to previous page/i)).toBeInTheDocument();
  },
};

export const DropdownInteractions: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/', () => HttpResponse.json(mockGroupData)),
        http.get('/api/rbac/v1/groups/', () => HttpResponse.json({ data: [], meta: { count: 0 } })),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test dropdown opens
    const kebabButton = await canvas.findByLabelText(/group-actions-dropdown/i);
    await userEvent.click(kebabButton);

    // Test dropdown items appear
    expect(await canvas.findByText('Edit')).toBeInTheDocument();
    expect(await canvas.findByText('Delete')).toBeInTheDocument();
  },
};

export const TabNavigation: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/', () => HttpResponse.json(mockGroupData)),
        http.get('/api/rbac/v1/groups/', () => HttpResponse.json({ data: [], meta: { count: 0 } })),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test initial tab state
    expect(await canvas.findByText('Roles')).toBeInTheDocument();
    expect(await canvas.findByText('Members')).toBeInTheDocument();

    // Test Members tab is clickable
    const membersTab = await canvas.findByText('Members');
    expect(membersTab.closest('a')).toHaveAttribute('href');
  },
};

export const RestoreDefaultModal: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/', () => HttpResponse.json(mockDefaultGroupModified)),
        http.get('/api/rbac/v1/groups/', () =>
          HttpResponse.json({
            data: [{ uuid: 'system-group-uuid' }],
            meta: { count: 1 },
          }),
        ),
        http.delete('/api/rbac/v1/groups/', () => HttpResponse.json({ message: 'Groups removed' })),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click restore button
    const restoreButton = await canvas.findByText(/restore default access/i);
    await userEvent.click(restoreButton);

    // Modal should appear in document.body
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();

    // Test modal content
    expect(within(modal).getByText(/restore default access/i)).toBeInTheDocument();
    expect(within(modal).getByText(/continue/i)).toBeInTheDocument();
  },
};
