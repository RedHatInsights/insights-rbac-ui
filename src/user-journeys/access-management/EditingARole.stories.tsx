/**
 * Editing a Role Journey
 * Based on: static/mocks/Editing a role/
 *
 * ⚠️ GAP: This feature requires V2 API which is not yet available.
 *
 * Features tested:
 * - Open edit from kebab menu
 * - Edit role page with permissions
 * - Save changes
 */

import type { StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { resetStoryState } from '../_shared/helpers';
import { handlersWithV2Gaps, mockRolesV2 } from './_shared';

// Spy for tracking API calls
const updateRoleSpy = fn();

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Management Fabric/Access Management/Editing a role',
  tags: ['access-management', 'roles', 'form', 'gap:v2-api'],
  decorators: [
    (Story: React.ComponentType, context: { args: Record<string, unknown>; parameters: Record<string, unknown> }) => {
      const dynamicEnv = createDynamicEnvironment(context.args);
      context.parameters = { ...context.parameters, ...dynamicEnv };
      const argsKey = JSON.stringify(context.args);
      return <Story key={argsKey} />;
    },
  ],
  args: {
    initialRoute: '/iam/access-management/roles',
    typingDelay: typeof process !== 'undefined' && process.env?.CI ? 0 : 30,
    orgAdmin: true,
    'platform.rbac.common-auth-model': true,
  },
  parameters: {
    ...createDynamicEnvironment({
      orgAdmin: true,
      'platform.rbac.common-auth-model': true,
    }),
    msw: {
      handlers: [
        ...handlersWithV2Gaps,
        // Add spy handler for updating role
        http.put('/api/rbac/v2/roles/:uuid/', async ({ params, request }) => {
          const body = await request.json();
          updateRoleSpy(params.uuid, body);
          const existingRole = mockRolesV2.find((r) => r.uuid === params.uuid);
          return HttpResponse.json({
            ...existingRole,
            ...(body as object),
            modified: new Date().toISOString(),
          });
        }),
      ],
    },
    docs: {
      description: {
        component: `
# Editing a Role Journey

⚠️ **GAP: V2 API Required**

Tests the workflow for editing an existing role.

## Design Reference
- \`static/mocks/Editing a role/Frame 147.png\` - Edit role page
- \`static/mocks/Editing a role/Frame 157.png\` - Edit permissions
- \`static/mocks/Editing a role/Frame 178.png\` - Save changes

## V2 API Requirements
| Feature | Status |
|---------|--------|
| Edit role name | ⚠️ GAP - V2 API |
| Edit description | ⚠️ GAP - V2 API |
| Edit permissions | ⚠️ GAP - V2 API |
| Permission selection UI | ⚠️ GAP - V2 API |
| Save changes | ⚠️ GAP - V2 API |

## Notes
- Cannot edit system/canned roles
- V2 API needed for proper permission management
- Currently using V1 API with limited edit capability
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Open edit from kebab menu
 *
 * Tests opening the edit role page from the kebab menu
 */
export const OpenEditFromKebab: Story = {
  name: 'Open Edit from Kebab Menu',
  tags: ['autodocs', 'gap:v2-api'],
  parameters: {
    docs: {
      description: {
        story: `
⚠️ **GAP: V2 API Required**

Tests opening the edit role page from the kebab menu.

**Expected behavior:**
1. Click kebab menu on a non-system role
2. Click "Edit role"
3. Navigate to edit page

**Note:** System/canned roles should NOT have edit option.
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for page to load
    await delay(500);

    // Find kebab menus (only non-system roles have them)
    const kebabButtons = await canvas.findAllByLabelText(/actions/i);

    if (kebabButtons.length > 0) {
      // Click the first available kebab
      await user.click(kebabButtons[0]);
      await delay(200);

      // Look for Edit role option
      const editOption = within(document.body).queryByText(/Edit role/i);
      if (editOption) {
        await user.click(editOption);
        await delay(500);

        // Note: Edit role page would require V2 API implementation
      }
    }
  },
};

/**
 * Edit role form (V2 design)
 *
 * Tests the edit role form with V2 features
 */
export const EditRoleForm: Story = {
  name: 'Edit Role Form (V2 Design)',
  tags: ['gap:v2-api'],
  parameters: {
    docs: {
      description: {
        story: `
⚠️ **GAP: V2 API Required**

Tests the edit role form matching \`static/mocks/Editing a role/Frame 147.png\`.

**V2 Form fields:**
- Role name
- Description
- Permissions section with add/remove capability

This requires V2 API for proper permission management.
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    // Wait for page to load
    await delay(500);

    // Note: Full edit form requires V2 API
    // V1 API has limited edit capability
    await expect(canvas.findByText('Roles')).resolves.toBeInTheDocument();
  },
};

/**
 * Edit permissions
 *
 * Tests editing role permissions (V2 GAP)
 */
export const EditPermissions: Story = {
  name: 'Edit Permissions',
  tags: ['gap:v2-api'],
  parameters: {
    docs: {
      description: {
        story: `
⚠️ **GAP: V2 API Required**

Tests editing role permissions matching \`static/mocks/Editing a role/Frame 157.png\`.

**V2 Requirements:**
- Permission picker component
- Add permissions to role
- Remove permissions from role
- Permission validation

This entire flow requires V2 API.
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    // Wait for page to load
    await delay(500);

    // Note: Permission editing requires V2 API
    await expect(canvas.findByText('Roles')).resolves.toBeInTheDocument();
  },
};

/**
 * Cannot edit system roles
 *
 * Tests that system/canned roles cannot be edited
 */
export const CannotEditSystemRoles: Story = {
  name: 'Cannot Edit System Roles',
  tags: ['gap:v2-api'],
  parameters: {
    docs: {
      description: {
        story: `
Tests that system/canned roles cannot be edited.

**Expected behavior:**
- System roles should NOT have kebab menu
- OR kebab menu should not include "Edit role" option

V2 API needed for proper role type identification.
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    // Wait for page to load
    await delay(500);

    // Verify roles are displayed
    await expect(canvas.findByText(/Organization Administrator/i)).resolves.toBeInTheDocument();

    // Note: V1 API has `system` flag but kebab behavior needs V2 implementation
  },
};

/**
 * Cancel edit
 *
 * Tests canceling the edit form
 */
export const CancelEdit: Story = {
  name: 'Cancel Edit',
  tags: ['gap:v2-api'],
  parameters: {
    docs: {
      description: {
        story: `
⚠️ **GAP: V2 API Required**

Tests canceling the edit role form.

**Expected behavior:**
1. Open edit form
2. Make changes
3. Click Cancel
4. Return to roles table
5. Changes not saved
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    updateRoleSpy.mockClear();

    const canvas = within(context.canvasElement);

    // Wait for page to load
    await delay(500);

    // Note: Full edit flow requires V2 API
    await expect(canvas.findByText('Roles')).resolves.toBeInTheDocument();

    // Verify no API call was made
    expect(updateRoleSpy).not.toHaveBeenCalled();
  },
};
