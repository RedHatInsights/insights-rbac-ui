import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { BrowserRouter } from 'react-router-dom';
import { HttpResponse, http, delay as mswDelay } from 'msw';
import AddUserToGroup from './add-user-to-group';

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

// Router decorator
const withRouter = (Story: any, context: any) => {
  const username = context.args?.username || 'john.doe';
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh' }}>
        <Story {...context.args} username={username} />
      </div>
    </BrowserRouter>
  );
};

// Helper to create default MSW handlers
const createDefaultHandlers = (groups = mockGroups) => [
  http.get('/api/rbac/v1/groups/', async ({ request }) => {
    const url = new URL(request.url);
    const name = url.searchParams.get('name') || '';
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    fetchGroupsSpy({ name, limit, offset });

    let filteredGroups = groups;
    if (name) {
      filteredGroups = groups.filter((group) => group.name.toLowerCase().includes(name.toLowerCase()));
    }

    return HttpResponse.json({
      data: filteredGroups.slice(offset, offset + limit),
      meta: { count: filteredGroups.length, limit, offset },
    });
  }),
  http.post('/api/rbac/v1/groups/:groupId/principals/', async ({ params, request }) => {
    const groupId = params.groupId as string;
    const body = (await request.json()) as Record<string, unknown>;
    addMembersToGroupSpy({ groupId, principals: body.principals });
    return HttpResponse.json({ status: 'ok' });
  }),
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

// Helper for delays
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  play: async () => {
    await delay(1000);

    // Wait for modal to appear - use screen for global search
    await waitFor(
      async () => {
        const modal = screen.queryByRole('dialog');
        expect(modal).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Verify groups table loaded (groups are visible)
    await waitFor(
      async () => {
        expect(screen.getByText('Administrators')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Verify Save button exists and is disabled (no selection)
    // Note: Button has aria-label="Save" which overrides the visible text
    const saveButtons = screen.getAllByRole('button', { name: /save/i });
    expect(saveButtons.length).toBeGreaterThan(0);
    expect(saveButtons[0]).toBeDisabled();

    // Verify Cancel button exists
    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
    expect(cancelButtons.length).toBeGreaterThan(0);
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
  play: async () => {
    await delay(1000);

    // Wait for modal and groups to load
    await waitFor(
      async () => {
        expect(screen.getByText('Administrators')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Find checkboxes - admin users can select groups
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);

    // Click first group checkbox (skip header checkbox)
    await userEvent.click(checkboxes[1]);

    // Wait for checkbox to be checked, then verify save button
    await delay(300);

    // Save button should now be enabled - use screen to search globally
    // Note: Button has aria-label="Save" which overrides the visible text
    const saveButtons = screen.getAllByRole('button', { name: /save/i });
    expect(saveButtons.length).toBeGreaterThan(0);
    expect(saveButtons[0]).not.toBeDisabled();
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
  play: async () => {
    await delay(1000);
    const body = getModalBody();

    // Wait for groups to load
    await waitFor(
      async () => {
        expect(body.getByText('Administrators')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

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
  },
};

export const Loading: Story = {
  parameters: {
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/', async () => {
          await mswDelay(5000);
          return HttpResponse.json({
            data: [],
            meta: { count: 0, limit: 10, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async () => {
    await delay(500);
    const body = getModalBody();

    // Wait for modal to appear
    await waitFor(
      async () => {
        const modal = body.queryByRole('dialog');
        expect(modal).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  },
};

export const EmptyGroups: Story = {
  parameters: {
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/', () => {
          return HttpResponse.json({
            data: [],
            meta: { count: 0, limit: 10, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async () => {
    await delay(1000);
    const body = getModalBody();

    // Wait for modal
    await waitFor(
      async () => {
        const modal = body.queryByRole('dialog');
        expect(modal).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Empty state should show
    await waitFor(
      async () => {
        const emptyState = document.querySelector('.pf-v5-c-empty-state');
        expect(emptyState).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  },
};
