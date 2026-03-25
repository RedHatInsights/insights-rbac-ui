import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Modal, ModalBody, ModalHeader, ModalVariant } from '@patternfly/react-core/dist/dynamic/components/Modal';
import { RoleAccessModalContent, type RoleAccessModalContentProps } from './RoleAccessModal';
import type { Role } from '../../../../data/api/roles';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockGroup = { uuid: 'group-1', name: 'Platform Administrators' };

const mockRoles: Role[] = [
  {
    id: 'role-1',
    name: 'Workspace Administrator',
    description: 'Full administrative access to workspace resources',
    permissions_count: 15,
    last_modified: '2024-01-20T14:45:00Z',
  },
  {
    id: 'role-2',
    name: 'Workspace Viewer',
    description: 'Read-only access to workspace resources',
    permissions_count: 8,
    last_modified: '2024-01-18T10:30:00Z',
  },
  {
    id: 'role-3',
    name: 'Workspace Editor',
    description: 'Edit access to workspace resources',
    permissions_count: 12,
    last_modified: '2024-01-19T09:15:00Z',
  },
  {
    id: 'role-4',
    name: 'Cost Administrator',
    description: 'Manage cost-related resources and budgets',
    permissions_count: 6,
    last_modified: '2024-01-17T16:20:00Z',
  },
  {
    id: 'role-5',
    name: 'Security Auditor',
    description: 'View security configurations and audit logs',
    permissions_count: 10,
    last_modified: '2024-01-16T11:00:00Z',
  },
];

const mockAssignedRoleIds = ['role-1', 'role-3'];

const mockRolesForPagination: Role[] = [
  ...mockRoles,
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `role-${i + 6}`,
    name: `Generated Role ${i + 6}`,
    description: `Auto-generated role number ${i + 6}`,
    permissions_count: Math.floor(Math.random() * 12) + 1,
    last_modified: new Date(2024, 0, 20 - i).toISOString(),
  })),
];

// ---------------------------------------------------------------------------
// Wrapper — manages isOpen state for stories that start closed
// ---------------------------------------------------------------------------

const ModalWrapper = ({ initialOpen = false, ...contentProps }: Partial<RoleAccessModalContentProps> & { initialOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const defaults: RoleAccessModalContentProps = {
    allRoles: mockRoles,
    assignedRoleIds: mockAssignedRoleIds,
    group: mockGroup,
    workspaceName: 'Development Workspace',
    onUpdate: contentProps.onUpdate ?? fn(),
    onClose: () => {
      contentProps.onClose?.();
      setIsOpen(false);
    },
  };

  const merged = { ...defaults, ...contentProps, onClose: defaults.onClose };

  return (
    <div style={{ padding: '16px' }}>
      {!isOpen && (
        <Button variant="primary" onClick={() => setIsOpen(true)} data-testid="open-modal-button">
          Open Role Access Modal
        </Button>
      )}
      {isOpen && (
        <Modal
          variant={ModalVariant.large}
          isOpen
          onClose={merged.onClose}
          ouiaId="role-access-modal"
          aria-labelledby="role-access-modal-title"
          aria-describedby="role-access-modal-body"
        >
          <ModalHeader title="Edit access" labelId="role-access-modal-title" />
          <ModalBody id="role-access-modal-body">
            <RoleAccessModalContent {...merged} />
          </ModalBody>
        </Modal>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof RoleAccessModalContent> = {
  component: RoleAccessModalContent,
  parameters: {
    docs: {
      description: {
        component: `
**RoleAccessModalContent** allows users to grant or remove role access for a group within a workspace.

- **Role Selection**: Checkbox-based role selection with search and filtering
- **Toggle**: Switch between all roles and selected roles
- **Pagination**: Handles large role lists with client-side pagination
- **Sorting**: Sortable by name and last modified date

Since this is a pure UI component (all data passed as props), **no MSW handlers are needed**.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof RoleAccessModalContent>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  tags: ['autodocs'],
  render: (args) => <ModalWrapper {...args} />,
  args: {
    allRoles: mockRoles,
    assignedRoleIds: mockAssignedRoleIds,
    group: mockGroup,
    workspaceName: 'Development Workspace',
    onClose: fn(),
    onUpdate: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Default state with modal closed. Click the button to open.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify default modal closed', async () => {
      const openButton = await canvas.findByTestId('open-modal-button');
      await expect(openButton).toBeInTheDocument();
    });
  },
};

export const ModalOpen: Story = {
  render: (args) => <ModalWrapper initialOpen {...args} />,
  args: {
    allRoles: mockRoles,
    assignedRoleIds: mockAssignedRoleIds,
    group: mockGroup,
    workspaceName: 'Development Workspace',
    onClose: fn(),
    onUpdate: fn(),
  },
  parameters: {
    docs: { description: { story: 'Modal in open state, showing the role selection interface.' } },
  },
  play: async ({ step }) => {
    await step('Verify modal open', async () => {
      const body = within(document.body);
      await expect(body.findByRole('dialog')).resolves.toBeInTheDocument();
      await expect(body.findByText(/Grant or remove access/)).resolves.toBeInTheDocument();
    });
  },
};

export const EmptyState: Story = {
  render: (args) => <ModalWrapper initialOpen {...args} />,
  args: {
    allRoles: [],
    assignedRoleIds: [],
    group: mockGroup,
    workspaceName: 'Development Workspace',
    onClose: fn(),
    onUpdate: fn(),
  },
  parameters: {
    docs: { description: { story: 'Modal showing empty state when no roles are available.' } },
  },
  play: async ({ step }) => {
    await step('Verify empty state', async () => {
      const body = within(document.body);
      await expect(body.findByRole('dialog')).resolves.toBeInTheDocument();
      await expect(body.findByText(/no roles found/i)).resolves.toBeInTheDocument();
    });
  },
};

export const Pagination: Story = {
  render: (args) => <ModalWrapper initialOpen {...args} />,
  args: {
    allRoles: mockRolesForPagination,
    assignedRoleIds: mockAssignedRoleIds,
    group: mockGroup,
    workspaceName: 'Development Workspace',
    onClose: fn(),
    onUpdate: fn(),
  },
  parameters: {
    docs: { description: { story: 'Modal with 25 roles to test pagination controls.' } },
  },
  play: async ({ step }) => {
    await step('Verify pagination', async () => {
      const body = within(document.body);
      await expect(body.findByRole('dialog')).resolves.toBeInTheDocument();

      await waitFor(() => {
        const paginationTexts = body.queryAllByText(/1 - 10/i);
        expect(paginationTexts.length).toBeGreaterThan(0);
      });

      const nextButtons = body.getAllByRole('button', { name: /next/i });
      const enabledNextButtons = nextButtons.filter((btn) => !btn.hasAttribute('disabled') && btn.getAttribute('aria-disabled') !== 'true');
      expect(enabledNextButtons.length).toBeGreaterThan(0);

      if (enabledNextButtons.length > 0) {
        await userEvent.click(enabledNextButtons[0]);
        await waitFor(
          () => {
            const page2Texts = body.queryAllByText(/11 - 20/i);
            expect(page2Texts.length).toBeGreaterThan(0);
          },
          { timeout: 5000 },
        );
      }

      const perPageButtons = body.queryAllByRole('button', { name: /items per page/i });
      if (perPageButtons.length > 0) {
        const perPageButton = perPageButtons[perPageButtons.length - 1];
        await userEvent.click(perPageButton);
        await waitFor(
          () => {
            const perPage20 = body.queryByRole('option', { name: /20 per page/i });
            expect(perPage20).toBeInTheDocument();
          },
          { timeout: 5000 },
        );
        const perPage20 = body.getByRole('option', { name: /20 per page/i });
        await userEvent.click(perPage20);
        await waitFor(
          () => {
            const updatedPaginationTexts = body.queryAllByText(/1 - 20/i);
            expect(updatedPaginationTexts.length).toBeGreaterThan(0);
          },
          { timeout: 5000 },
        );
      }
    });
  },
};

export const TabSwitchWithPagination: Story = {
  render: (args) => <ModalWrapper initialOpen {...args} />,
  args: {
    allRoles: mockRolesForPagination,
    assignedRoleIds: mockAssignedRoleIds,
    group: mockGroup,
    workspaceName: 'Development Workspace',
    onClose: fn(),
    onUpdate: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests: switch to page 2, then switch to Selected toggle. Pagination should reset to page 1 and show only the 2 selected roles.',
      },
    },
  },
  play: async ({ step }) => {
    await step('Verify tab switch with pagination', async () => {
      const body = within(document.body);
      await expect(body.findByRole('dialog')).resolves.toBeInTheDocument();

      await waitFor(() => {
        expect(body.queryByText('Cost Administrator')).toBeInTheDocument();
      });

      // Navigate to page 2
      const nextButtons = body.getAllByRole('button', { name: /next/i });
      const enabledNextButtons = nextButtons.filter((btn) => !btn.hasAttribute('disabled') && btn.getAttribute('aria-disabled') !== 'true');
      if (enabledNextButtons.length > 0) {
        await userEvent.click(enabledNextButtons[0]);
        await waitFor(
          () => {
            const page2Texts = body.queryAllByText(/11 - 20/i);
            expect(page2Texts.length).toBeGreaterThan(0);
          },
          { timeout: 5000 },
        );
      }

      // Switch to Selected toggle
      const selectedTab = body.getByRole('button', { name: /selected/i });
      await userEvent.click(selectedTab);

      await waitFor(
        () => {
          const page1Texts = body.queryAllByText(/1 - 2/i);
          expect(page1Texts.length).toBeGreaterThan(0);
          expect(body.queryByText('Workspace Administrator')).toBeInTheDocument();
          expect(body.queryByText('Workspace Editor')).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      // Page 2 text should be gone
      const page2Texts = body.queryAllByText(/11 - 20/i);
      expect(page2Texts.length).toBe(0);
    });
  },
};

/**
 * Verify Update is disabled when all roles are deselected.
 */
export const UpdateDisabledWhenEmpty: Story = {
  render: (args) => <ModalWrapper initialOpen {...args} />,
  args: {
    allRoles: mockRoles,
    assignedRoleIds: mockAssignedRoleIds,
    group: mockGroup,
    workspaceName: 'Development Workspace',
    onClose: fn(),
    onUpdate: fn(),
  },
  parameters: {
    docs: { description: { story: 'Update button should be disabled when all roles are deselected.' } },
  },
  play: async ({ step }) => {
    await step('Deselect all and verify Update is disabled', async () => {
      const body = within(document.body);
      const dialog = await body.findByRole('dialog', {}, { timeout: 5000 });
      const modalScope = within(dialog);
      const table = await modalScope.findByRole('grid', { name: /roles selection table/i });
      const tableScope = within(table);

      await waitFor(
        () => {
          expect(tableScope.queryByText('Workspace Administrator')).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      const checkboxes = table.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked');
      for (const cb of checkboxes) {
        await userEvent.click(cb);
      }

      const updateButton = await modalScope.findByRole('button', { name: /update/i });
      await expect(updateButton).toBeDisabled();
    });
  },
};

/**
 * Edit access journey: open modal, change selection, save, verify callback.
 *
 * **Journey:**
 * 1. Click "Open Role Access Modal"
 * 2. Wait for roles (Workspace Administrator and Workspace Editor pre-selected)
 * 3. Deselect Workspace Editor
 * 4. Click "Update" and verify onUpdate is called with ['role-1']
 * 5. Modal closes
 */
export const EditAccessJourney: Story = {
  name: 'Journey / Edit access (grant or remove roles)',
  tags: ['autodocs'],
  render: (args) => <ModalWrapper {...args} />,
  args: {
    allRoles: mockRoles,
    assignedRoleIds: mockAssignedRoleIds,
    group: mockGroup,
    workspaceName: 'Development Workspace',
    onClose: fn(),
    onUpdate: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: `
## Edit Access Journey

1. Click **Open Role Access Modal**
2. Verify pre-selected roles (Workspace Administrator, Workspace Editor)
3. Deselect Workspace Editor
4. Click **Update** — \`onUpdate\` called with \`['role-1']\`
5. Modal closes
        `,
      },
    },
  },
  play: async ({ canvasElement, args, step }) => {
    const onUpdateSpy = args.onUpdate as ReturnType<typeof fn>;
    onUpdateSpy.mockClear();

    await step('Edit access journey', async () => {
      const canvas = within(canvasElement);
      const openButton = await canvas.findByTestId('open-modal-button');
      await userEvent.click(openButton);

      const body = within(document.body);
      const dialog = await body.findByRole('dialog', {}, { timeout: 5000 });
      await expect(dialog).toBeInTheDocument();
      await expect(body.findByText(/Grant or remove access/)).resolves.toBeInTheDocument();

      await waitFor(
        async () => {
          await expect(body.findByText('Workspace Administrator')).resolves.toBeInTheDocument();
          await expect(body.findByText('Workspace Editor')).resolves.toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      const modalScope = within(dialog);
      const table = await modalScope.findByRole('grid', { name: /roles selection table/i });
      const tableScope = within(table);

      const editorRow = (await tableScope.findByText('Workspace Editor')).closest('tr') as HTMLElement;
      expect(editorRow).toBeInTheDocument();
      const editorCheckbox = editorRow?.querySelector('input[type="checkbox"]');
      expect(editorCheckbox).toBeInTheDocument();
      await userEvent.click(editorCheckbox!);

      const updateButton = await modalScope.findByRole('button', { name: /update/i });
      expect(updateButton).not.toBeDisabled();
      await userEvent.click(updateButton);

      await waitFor(
        () => {
          expect(onUpdateSpy).toHaveBeenCalledTimes(1);
          expect(onUpdateSpy).toHaveBeenCalledWith(['role-1']);
        },
        { timeout: 5000 },
      );
    });
  },
};
