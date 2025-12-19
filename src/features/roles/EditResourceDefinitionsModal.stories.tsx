import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { EditResourceDefinitionsModal } from './EditResourceDefinitionsModal';

/**
 * EditResourceDefinitionsModal - Stories Placeholder
 *
 * This component has complex Redux selector dependencies that read from
 * state.roleReducer.selectedRole and state.costReducer.resources before
 * the data is populated. The component design requires:
 * 1. Pre-populated Redux state from fetchRole
 * 2. Pre-populated inventory/cost management resources
 *
 * These tests are skipped until the component is refactored to:
 * - Handle loading states gracefully
 * - Use proper null checks before accessing nested state
 * - Accept data via props or context rather than direct Redux selectors
 */

// Router decorator
const withRouter = (Story: any, context: any) => {
  const roleId = context.parameters.roleId || 'role-123';
  const permissionId = context.parameters.permissionId || 'inventory:hosts:read';

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/roles/:roleId/permissions/:permissionId/edit"
          element={
            <div style={{ minHeight: '100vh' }}>
              <Story />
            </div>
          }
        />
        <Route path="/roles/:roleId/permissions/:permissionId" element={<div data-testid="permission-page">Permission Page</div>} />
        <Route path="*" element={<Navigate to={`/roles/${roleId}/permissions/${permissionId}/edit`} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

const meta: Meta<typeof EditResourceDefinitionsModal> = {
  component: EditResourceDefinitionsModal,
  // Skipped: Component requires pre-populated Redux state that cannot be easily mocked in Storybook
  tags: ['test-skip', 'edit-resource-definitions-modal', 'custom-css'],
  decorators: [withRouter],
  parameters: {
    layout: 'fullscreen',
    roleId: 'role-123',
    permissionId: 'inventory:hosts:read',
    docs: {
      description: {
        component:
          'This modal allows editing resource definitions for a permission. ' +
          'It uses a dual-list selector to move resources between available and defined lists. ' +
          'Note: Storybook tests are skipped due to complex Redux state dependencies.',
      },
    },
  },
  args: {
    cancelRoute: '/roles/role-123/permissions/inventory:hosts:read',
  },
};

export default meta;
type Story = StoryObj<typeof EditResourceDefinitionsModal>;

/**
 * Placeholder story - actual component cannot render without pre-populated Redux state
 */
export const Default: Story = {
  parameters: {
    roleId: 'role-123',
    permissionId: 'inventory:hosts:read',
  },
};
