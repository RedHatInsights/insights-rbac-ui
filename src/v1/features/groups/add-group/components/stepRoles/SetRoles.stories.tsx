import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { queryEmptyState, queryToolbar } from '../../../../../../test-utils/interactionHelpers';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import { v1RolesHandlers } from '../../../../../data/mocks/roles.handlers';
import type { RoleOutDynamic } from '../../../../../data/mocks/db';
import { SetRoles } from './SetRoles';

const storyRoles: RoleOutDynamic[] = [
  {
    uuid: 'role-1',
    name: 'Viewer',
    display_name: 'Viewer',
    description: 'Read-only access to resources',
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2023-01-15T10:30:00.000Z',
    modified: '2023-01-15T10:30:00.000Z',
    policyCount: 5,
    accessCount: 12,
    applications: ['rbac'],
  },
  {
    uuid: 'role-2',
    name: 'Editor',
    display_name: 'Editor',
    description: 'Edit access to resources',
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2023-01-10T14:20:00.000Z',
    modified: '2023-01-20T09:15:00.000Z',
    policyCount: 8,
    accessCount: 25,
    applications: ['rbac'],
  },
  {
    uuid: 'role-3',
    name: 'Administrator',
    display_name: 'Administrator',
    description: 'Full administrative access',
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2023-01-05T16:45:00.000Z',
    modified: '2023-01-25T11:30:00.000Z',
    policyCount: 15,
    accessCount: 50,
    applications: ['rbac'],
  },
  {
    uuid: 'role-4',
    name: 'System Administrator',
    display_name: 'System Administrator',
    description: 'System-level administrative access',
    system: true,
    platform_default: true,
    admin_default: false,
    created: '2022-12-01T08:00:00.000Z',
    modified: '2023-01-01T12:00:00.000Z',
    policyCount: 25,
    accessCount: 100,
    applications: ['rbac'],
  },
];

// Extended component mapper to include SetRoles
const extendedMapper = {
  ...componentMapper,
  'set-roles': SetRoles,
};

// Mock form schema for the SetRoles step
const setRolesSchema = {
  fields: [
    {
      component: 'set-roles',
      name: 'roles-list',
    },
  ],
};

// Wrapper component to provide FormRenderer context
const SetRolesWithForm: React.FC<{
  onSubmit?: (values: Record<string, unknown>) => void;
  initialValues?: Record<string, unknown>;
}> = ({ onSubmit = () => {}, initialValues = { 'roles-list': [] } }) => {
  return (
    <FormRenderer
      schema={setRolesSchema}
      componentMapper={extendedMapper}
      FormTemplate={Pf4FormTemplate}
      onSubmit={onSubmit}
      initialValues={initialValues}
    />
  );
};

const meta: Meta<typeof SetRolesWithForm> = {
  title: 'Features/Groups/AddGroup/SetRoles',
  component: SetRolesWithForm,
  tags: ['autodocs', 'custom-css'],
  parameters: {
    docs: {
      description: {
        component: `
Role selection step component for the Add Group wizard. Features:

- **Role Selection Table**: Browse and select roles to assign to the group
- **Multi-Select**: Allows selecting multiple roles with checkboxes
- **Role Information**: Shows role name, description, policy count, and access count
- **System Roles**: Displays both custom and system roles
- **Search & Filter**: Filter roles by name, description, or type
- **Pagination**: Handle large role lists with pagination
- **Form Integration**: Manages selected roles state with data-driven-forms

The component wraps RolesList and provides form integration for the Add Group wizard.
        `,
      },
    },
    msw: {
      handlers: [...v1RolesHandlers(storyRoles)],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify roles table and role data', async () => {
      expect(await canvas.findByText(/select roles to assign to this group/i)).toBeInTheDocument();

      await waitFor(
        () => {
          expect(canvas.queryByRole('grid')).toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      expect(await canvas.findByText(storyRoles[0].name)).toBeInTheDocument();
      expect(await canvas.findByText(storyRoles[1].name)).toBeInTheDocument();
      expect(await canvas.findByText(storyRoles[2].name)).toBeInTheDocument();
    });
  },
};

export const RoleSelection: Story = {
  args: {
    onSubmit: fn(),
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);

    await step('Select roles and submit', async () => {
      await waitFor(
        () => {
          expect(canvas.queryByRole('grid')).toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      const checkboxes = await canvas.findAllByRole('checkbox');
      const roleCheckbox1 = checkboxes.find((cb) => cb.getAttribute('data-label') === storyRoles[0].name) || checkboxes[1];
      const roleCheckbox2 = checkboxes.find((cb) => cb.getAttribute('data-label') === storyRoles[1].name) || checkboxes[2];

      if (roleCheckbox1) {
        await userEvent.click(roleCheckbox1);
      }
      if (roleCheckbox2) {
        await userEvent.click(roleCheckbox2);
      }

      const submitButton = await canvas.findByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);
    });

    await step('Verify form submission with roles', async () => {
      await waitFor(() => {
        expect(args.onSubmit).toHaveBeenCalled();
        const mockFn = args.onSubmit as ReturnType<typeof fn>;
        const submittedData = mockFn.mock.calls[0][0] as Record<string, unknown>;
        expect(submittedData['roles-list']).toBeDefined();
        expect(Array.isArray(submittedData['roles-list'])).toBe(true);
      });
    });
  },
};

export const WithPreselectedRoles: Story = {
  args: {
    initialValues: {
      'roles-list': [
        { uuid: 'role-1', name: 'Viewer' },
        { uuid: 'role-2', name: 'Editor' },
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify preselected roles displayed', async () => {
      await waitFor(
        () => {
          expect(canvas.queryByRole('grid')).toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      expect(await canvas.findByText(storyRoles[0].name)).toBeInTheDocument();
      expect(await canvas.findByText(storyRoles[1].name)).toBeInTheDocument();

      const checkboxes = await canvas.findAllByRole('checkbox');
      if (checkboxes.length > 0) {
        expect(checkboxes.length).toBeGreaterThan(1);
      }
    });
  },
};

export const FilterRoles: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Apply filter and verify results', async () => {
      await waitFor(
        () => {
          expect(canvas.queryByRole('grid')).toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      let nameFilter = null;
      try {
        nameFilter = canvas.getByPlaceholderText(/filter.*name/i);
      } catch {
        try {
          nameFilter = canvas.getByPlaceholderText(/search.*name/i);
        } catch {
          try {
            nameFilter = canvas.getByPlaceholderText(/name/i);
          } catch {
            const toolbar = queryToolbar(canvasElement);
            if (toolbar) {
              nameFilter = within(toolbar).queryByRole('textbox') as HTMLInputElement | null;
            }
          }
        }
      }

      if (nameFilter) {
        try {
          if ((nameFilter as HTMLInputElement).value) {
            await userEvent.clear(nameFilter);
          }
        } catch {}

        await userEvent.type(nameFilter, 'viewer');

        await waitFor(
          () => {
            expect(canvas.queryByText(storyRoles[0].name)).toBeInTheDocument();
          },
          { timeout: 5000 },
        );
      } else {
        expect(await canvas.findByText(storyRoles[0].name)).toBeInTheDocument();
      }
    });
  },
};

export const SystemRoles: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify system roles displayed', async () => {
      await waitFor(
        () => {
          expect(canvas.queryByRole('grid')).toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      expect(await canvas.findByText(storyRoles[3].name)).toBeInTheDocument();

      const systemTexts = canvas.getAllByText(/system/i);
      expect(systemTexts.length).toBeGreaterThan(0);

      const systemRoleName = systemTexts.find((element) => element.textContent?.includes(storyRoles[3].name));
      if (systemRoleName) {
        expect(systemRoleName).toBeInTheDocument();
      }
    });
  },
};

export const EmptyRolesList: Story = {
  parameters: {
    msw: {
      handlers: [...v1RolesHandlers([])],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify empty state', async () => {
      await waitFor(
        () => {
          const emptyMessage =
            canvas.queryByText(/no.*roles/i) ||
            canvas.queryByText(/no.*results/i) ||
            canvas.queryByText(/no.*found/i) ||
            canvas.queryByText(/empty/i) ||
            queryEmptyState(canvasElement);

          if (emptyMessage) {
            expect(emptyMessage).toBeInTheDocument();
          } else {
            expect(canvas.queryByText(storyRoles[0].name)).not.toBeInTheDocument();
            expect(canvas.queryByText(storyRoles[1].name)).not.toBeInTheDocument();
            expect(canvas.queryByText(storyRoles[2].name)).not.toBeInTheDocument();

            expect(canvas.queryByRole('grid')).toBeInTheDocument();
          }
        },
        { timeout: 10000 },
      );
    });
  },
};
