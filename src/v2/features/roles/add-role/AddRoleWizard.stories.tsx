import React from 'react';
import type { Meta, StoryFn, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AddRoleWizard } from './AddRoleWizard';
import { IntlMessagesProvider } from '../../../../shared/i18n';
import { messageCatalogs } from '../../../../shared/i18n/messageCatalogs';
import messageDescriptors from '../../../../Messages';
import { permissionsHandlers } from '../../../../shared/data/mocks/permissions.handlers';
import { v2RolesHandlers } from '../../../data/mocks/roles.handlers';

// API Spies
const createRoleSpy = fn();
const fetchRolesSpy = fn();

// Mock permissions data (MockPermission format: uuid, permission, application, resource, operation)
const mockPermissions = [
  { uuid: 'inventory:hosts:read', permission: 'inventory:hosts:read', application: 'inventory', resource: 'hosts', operation: 'read' },
  { uuid: 'inventory:hosts:write', permission: 'inventory:hosts:write', application: 'inventory', resource: 'hosts', operation: 'write' },
  { uuid: 'cost-management:rate:read', permission: 'cost-management:rate:read', application: 'cost-management', resource: 'rate', operation: 'read' },
  { uuid: 'rbac:role:read', permission: 'rbac:role:read', application: 'rbac', resource: 'role', operation: 'read' },
];

// Mock roles for copy (V2 Role type)
const mockRoles = [
  {
    id: 'role-1',
    name: 'Platform Administrator',
    description: 'Full platform access',
    permissions_count: 5,
    permissions: [],
    last_modified: '2024-01-01T00:00:00Z',
  },
  {
    id: 'role-2',
    name: 'Cost Management Viewer',
    description: 'View cost reports',
    permissions_count: 3,
    permissions: [],
    last_modified: '2024-01-02T00:00:00Z',
  },
];

// Router decorator - V2 paths
const withRouter = (Story: StoryFn) => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/access-management/roles/add-role"
          element={
            <div style={{ minHeight: '100vh' }}>
              <Story />
            </div>
          }
        />
        <Route path="/access-management/roles" element={<div data-testid="roles-page">Roles Page</div>} />
        <Route path="/access-management/users-and-user-groups/user-groups" element={<div data-testid="groups-page">User Groups Page</div>} />
        <Route path="*" element={<Navigate to="/access-management/roles/add-role" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

const meta: Meta<typeof AddRoleWizard> = {
  component: AddRoleWizard,
  tags: ['add-role-wizard', 'custom-css'],
  decorators: [withRouter],
  parameters: {
    docs: {
      description: {
        component: `
### Design References

<img src="/mocks/workspaces/Creating a role.png" alt="Creating a role" width="400" />
        `,
      },
    },
    layout: 'fullscreen',
  },
  args: {
    pagination: { limit: 20 },
    filters: {},
  },
};

export default meta;
type Story = StoryObj<typeof AddRoleWizard>;

// Default handlers - V2 API endpoints
const createDefaultHandlers = () => [
  ...permissionsHandlers(mockPermissions, { networkDelay: 100 }),
  ...v2RolesHandlers(mockRoles, {
    networkDelay: 100,
    onList: fetchRolesSpy,
    onCreate: createRoleSpy,
  }),
];

/**
 * Default state - Wizard opens with "Create role" step
 */
export const Default: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ step }) => {
    await step('Verify default wizard', async () => {
      const body = within(document.body);

      const dialogs = await body.findAllByRole('dialog');
      expect(dialogs.length).toBeGreaterThan(0);

      const createRoleTexts = body.getAllByText(/create role/i);
      expect(createRoleTexts.length).toBeGreaterThan(0);

      expect(body.getByText(/create a role from scratch/i)).toBeInTheDocument();
      expect(body.getByText(/copy an existing role/i)).toBeInTheDocument();
    });
  },
};

/**
 * Select "Create from scratch" option
 */
export const SelectCreateFromScratch: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ step }) => {
    await step('Select create from scratch', async () => {
      const body = within(document.body);

      await body.findAllByRole('dialog');

      const createOption = body.getByText(/create a role from scratch/i);
      await userEvent.click(createOption);

      await waitFor(() => {
        const nameInputs = body.queryAllByRole('textbox');
        expect(nameInputs.length).toBeGreaterThan(0);
      });
    });
  },
};

/**
 * Select "Copy existing role" option
 */
export const SelectCopyExistingRole: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ step }) => {
    await step('Select copy existing role', async () => {
      const body = within(document.body);

      await body.findAllByRole('dialog');

      const copyOption = body.getByText(/copy an existing role/i);
      expect(copyOption).toBeInTheDocument();
      await userEvent.click(copyOption);

      const radioInputs = await body.findAllByRole('radio');
      expect(radioInputs.length).toBeGreaterThan(0);
    });
  },
};

/**
 * Enter role name when creating from scratch
 */
export const EnterRoleName: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ step }) => {
    await step('Enter role name', async () => {
      const body = within(document.body);

      await body.findAllByRole('dialog');

      const createOption = body.getByText(/create a role from scratch/i);
      await userEvent.click(createOption);

      const nameInputs = await body.findAllByRole('textbox');
      const nameInput = nameInputs[0];
      await userEvent.type(nameInput, 'My Test Role');
      expect(nameInput).toHaveValue('My Test Role');
    });
  },
};

/**
 * Cancel button is visible
 */
export const CancelButtonVisible: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ step }) => {
    await step('Verify cancel button visible', async () => {
      const body = within(document.body);

      await body.findAllByRole('dialog');

      const cancelButton = body.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeInTheDocument();
      expect(cancelButton).toBeEnabled();
    });
  },
};

/**
 * Next button initially visible
 */
export const NextButtonVisible: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ step }) => {
    await step('Verify next button visible', async () => {
      const body = within(document.body);

      await body.findAllByRole('dialog');

      const nextButton = body.getByRole('button', { name: /next/i });
      expect(nextButton).toBeInTheDocument();
    });
  },
};

/**
 * Regression (PR review): the wizard schema must rebuild when the async catalog resolves.
 *
 * IntlMessagesProvider renders children before the catalog arrives, so the schema is
 * first built with an English-only intl. When the French catalog lands, the wizard
 * must rebuild its schema — otherwise it keeps the stale English schema for the whole
 * session (reproduces the initial-French-load case, not just language switching).
 */
export const TranslatedSchemaAfterDelayedCatalog: Story = {
  beforeEach: () => {
    const fr: Record<string, string> = {
      createRole: 'Créer un rôle',
      createRoleFromScratch: 'Créer un rôle à partir de zéro',
      copyAnExistingRole: 'Copier un rôle existant',
    };
    messageCatalogs.fr = () =>
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              default: Object.fromEntries(
                Object.entries(messageDescriptors).map(([key, descriptor]) => [
                  key,
                  fr[key] ?? (descriptor as { defaultMessage: string }).defaultMessage,
                ]),
              ),
            }),
          2000,
        ),
      );
  },
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  render: () => (
    <IntlMessagesProvider locale="fr">
      <AddRoleWizard pagination={{ limit: 20 }} filters={{}} />
    </IntlMessagesProvider>
  ),
  play: async ({ step }) => {
    await step('Wizard renders the English schema while the catalog is in flight', async () => {
      const body = within(document.body);
      await body.findAllByRole('dialog');
      expect(body.getAllByText(/create a role from scratch/i).length).toBeGreaterThan(0);
    });

    await step('Schema rebuilds in French once the catalog resolves', async () => {
      const body = within(document.body);
      await waitFor(
        () => {
          // The radio labels (TypeSelector) and the h1 (CreateRoleStepTemplate)
          // render from live intl and flip on their own. The wizard header is
          // owned by the stored schema: it only flips if the schema was rebuilt
          // with the resolved catalog — that is the regression this story guards.
          expect(body.queryAllByText(/create a role from scratch|copy an existing role/i)).toHaveLength(0);
          expect(body.queryAllByText(/^créer un rôle$/i).length).toBeGreaterThanOrEqual(2);
        },
        { timeout: 8000 },
      );
    });
  },
};
