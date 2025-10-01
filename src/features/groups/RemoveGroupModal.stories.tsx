import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HttpResponse, delay, http } from 'msw';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { RemoveGroupModal } from './RemoveGroupModal';

// Wrapper component with button to open modal
const RemoveGroupModalWrapper: React.FC<any> = ({ postMethod, initialRoute, ...props }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleOpenModal = () => setIsOpen(true);

  return (
    <div style={{ height: '100vh' }}>
      <button onClick={handleOpenModal}>Remove Group</button>
      {isOpen && (
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route
              path="/groups/remove-group/:groupId"
              element={<RemoveGroupModal postMethod={postMethod} pagination={{ limit: 20 }} cancelRoute="/groups" submitRoute="/groups" {...props} />}
            />
          </Routes>
        </MemoryRouter>
      )}
    </div>
  );
};

const meta: Meta<typeof RemoveGroupModalWrapper> = {
  component: RemoveGroupModalWrapper,
  tags: ['remove-group-modal'], // NO autodocs on meta
  args: {
    postMethod: fn(),
  },
  argTypes: {
    initialRoute: {
      description: 'Initial route for the story',
      control: 'text',
    },
    postMethod: {
      description: 'Callback function called after group removal',
    },
  },
  parameters: {
    msw: {
      handlers: [
        // Group API handler - only called for single groups (not multiple)
        http.get('/api/rbac/v1/groups/:groupId/', ({ params }) => {
          const { groupId } = params;

          if (groupId === 'system-group-id') {
            return HttpResponse.json({
              uuid: groupId,
              name: 'Default access',
              description: 'System default group',
              system: true,
              platform_default: true,
              admin_default: false,
              created: '2024-01-15T10:30:00.000Z',
              modified: '2024-01-15T10:30:00.000Z',
              principalCount: 100,
              roleCount: 25,
            });
          }

          return HttpResponse.json({
            uuid: groupId,
            name: 'Test Group',
            description: 'A test group for demonstration',
            system: false,
            platform_default: false,
            admin_default: false,
            created: '2024-01-15T10:30:00.000Z',
            modified: '2024-01-15T10:30:00.000Z',
            principalCount: 5,
            roleCount: 3,
          });
        }),

        // Remove groups API handler - matches actual API call pattern
        http.delete('/api/rbac/v1/groups/:groupIds/', () => {
          return HttpResponse.json({ message: 'Groups deleted successfully' });
        }),

        // Default "loaded" state handler - provides initial group for Redux
        http.get('/api/rbac/v1/groups/', () => {
          return HttpResponse.json({
            data: [],
            meta: { count: 0, limit: 20, offset: 0 },
          });
        }),
      ],
    },
    docs: {
      description: {
        component: `
**Remove Group Modal** - Confirms deletion of one or more groups

This modal component handles group deletion with proper warning messages and loading states.

### Key Features:
- **Single Group Deletion**: Shows group name and confirmation message
- **Multiple Group Deletion**: Shows count and bulk deletion warning  
- **Loading States**: Displays skeleton while fetching group data
- **System Group Protection**: Handles system/platform default groups
- **Navigation Integration**: Uses React Router for cancel/submit routes
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleGroup: Story = {
  tags: ['autodocs'], // ONLY story with autodocs
  args: {
    initialRoute: '/groups/remove-group/test-group-id',
    postMethod: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: `
**Single Group Removal**: Modal for removing a single user-created group with confirmation and API orchestration.

## Additional Test Stories

For testing specific scenarios, see these additional stories:

- **[SystemGroup](?path=/story/features-groups-removegroupmodal--system-group)**: Tests removal of system/platform default groups
- **[MultipleGroups](?path=/story/features-groups-removegroupmodal--multiple-groups)**: Tests bulk removal of multiple groups with count-based messaging

## Component Features

- **Single vs Multiple Detection**: Automatically detects comma-separated group IDs for bulk operations
- **Group Data Loading**: Fetches individual group details for single group removal (shows group name)
- **System Group Handling**: Supports removal of special system/platform default groups  
- **API Integration**: Real API calls with postMethod callback after successful removal
- **Loading States**: Shows skeleton loader while fetching group details for single groups
        `,
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    await delay(300); // Required for MSW

    const canvas = within(canvasElement);

    // Click button to open modal
    const openButton = canvas.getByRole('button', { name: 'Remove Group' });
    await userEvent.click(openButton);

    // ✅ Modal renders to document.body via portal - use screen, not canvas
    await waitFor(
      async () => {
        const modal = screen.getByRole('dialog');
        expect(modal).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // ✅ Test modal content using within(modal) - wait for group data to load
    const modal = screen.getByRole('dialog');

    // Wait for group data to load and title to update
    await waitFor(
      () => {
        expect(within(modal).getByText('Remove group "Test Group"?')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    expect(within(modal).getByText('Test Group')).toBeInTheDocument();

    // ✅ Test Remove button functionality
    const removeButton = within(modal).getByRole('button', { name: /remove/i });
    await userEvent.click(removeButton);

    // ✅ Verify postMethod spy was called with correct parameters
    await waitFor(
      () => {
        expect(args.postMethod).toHaveBeenCalledWith(['test-group-id'], { limit: 20 });
      },
      { timeout: 3000 },
    );
  },
};

export const SystemGroup: Story = {
  args: {
    initialRoute: '/groups/remove-group/system-group-id',
    postMethod: fn(),
  },
  play: async ({ canvasElement, args }) => {
    await delay(300); // Required for MSW

    const canvas = within(canvasElement);

    // Click button to open modal
    const openButton = canvas.getByRole('button', { name: 'Remove Group' });
    await userEvent.click(openButton);

    // ✅ Modal renders to document.body via portal - use screen, not canvas
    await waitFor(
      async () => {
        const modal = screen.getByRole('dialog');
        expect(modal).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // ✅ Test modal content using within(modal) - wait for group data to load
    const modal = screen.getByRole('dialog');

    // Wait for system group data to load and title to update
    await waitFor(
      () => {
        expect(within(modal).getByText('Remove group "Default access"?')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    expect(within(modal).getByText('Default access')).toBeInTheDocument();

    // ✅ Test Remove button functionality for system group
    const removeButton = within(modal).getByRole('button', { name: /remove/i });
    await userEvent.click(removeButton);

    // ✅ Verify postMethod spy was called with system group ID
    await waitFor(() => {
      expect(args.postMethod).toHaveBeenCalledWith(['system-group-id'], { limit: 20 });
    });
  },
};

export const MultipleGroups: Story = {
  args: {
    initialRoute: '/groups/remove-group/group-1,group-2,group-3',
    postMethod: fn(),
  },
  play: async ({ canvasElement, args }) => {
    await delay(300); // Required for MSW

    const canvas = within(canvasElement);

    // Click button to open modal
    const openButton = canvas.getByRole('button', { name: 'Remove Group' });
    await userEvent.click(openButton);

    // ✅ Modal renders to document.body via portal - use screen, not canvas
    await waitFor(
      async () => {
        const modal = screen.getByRole('dialog');
        expect(modal).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    const modal = screen.getByRole('dialog');

    // ✅ Multiple groups should show count-based messages, not individual group names
    expect(within(modal).getByText('Remove 3 groups?')).toBeInTheDocument();

    // Should show multiple groups deletion message
    expect(
      within(modal).getByText((content) => {
        return content.toLowerCase().includes('permanently delete') && content.includes('3 groups');
      }),
    ).toBeInTheDocument();

    // ✅ Test Remove button functionality for multiple groups
    const removeButton = within(modal).getByRole('button', { name: /remove/i });
    await userEvent.click(removeButton);

    // ✅ Verify postMethod spy was called with all group IDs
    await waitFor(() => {
      expect(args.postMethod).toHaveBeenCalledWith(['group-1', 'group-2', 'group-3'], { limit: 20 });
    });
  },
};
