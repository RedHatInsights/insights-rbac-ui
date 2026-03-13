import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, waitFor, within } from 'storybook/test';
import { type PermissionRow, RolePermissionsTable } from './RolePermissionsTable';

const samplePermissions: PermissionRow[] = [
  { permission: 'rbac:principal:read', application: 'rbac', resource: 'principal', operation: 'read' },
  { permission: 'rbac:group:write', application: 'rbac', resource: 'group', operation: 'write' },
  { permission: 'inventory:hosts:read', application: 'inventory', resource: 'hosts', operation: 'read' },
];

const meta: Meta = {
  component: RolePermissionsTable,
};

export default meta;
type Story = StoryObj;

export const WithPermissions: Story = {
  render: () => <RolePermissionsTable permissions={samplePermissions} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify permissions table', async () => {
      const table = await canvas.findByRole('grid');
      await expect(table).toBeInTheDocument();

      // Column headers
      await expect(canvas.findByText('Application')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Resource type')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Operation')).resolves.toBeInTheDocument();

      // Verify specific cell data from each row
      await expect(canvas.findByText('principal')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('group')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('hosts')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('inventory')).resolves.toBeInTheDocument();

      // 'rbac' appears in 2 rows — use findAllByText
      const rbacCells = await canvas.findAllByText('rbac');
      await expect(rbacCells.length).toBe(2);

      // 'read' appears in 2 rows
      const readCells = await canvas.findAllByText('read');
      await expect(readCells.length).toBe(2);

      // 3 data rows + 1 header row = 4
      const rows = within(table).getAllByRole('row');
      await expect(rows.length).toBe(4);
    });
  },
};

export const Empty: Story = {
  render: () => <RolePermissionsTable permissions={[]} />,
  play: async ({ canvasElement, step }) => {
    await step('Verify empty', async () => {
      await waitFor(() => {
        const dataRows = canvasElement.querySelectorAll('tbody tr');
        expect(dataRows.length).toBe(0);
      });
    });
  },
};

export const Loading: Story = {
  render: () => <RolePermissionsTable permissions={undefined} />,
  play: async ({ canvasElement, step }) => {
    await step('Verify loading', async () => {
      await waitFor(() => {
        const skeletons = canvasElement.querySelectorAll('[class*="skeleton"], .pf-v6-c-skeleton');
        expect(skeletons.length).toBeGreaterThan(0);
      });
    });
  },
};
