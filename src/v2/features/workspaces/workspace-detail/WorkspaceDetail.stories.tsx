import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { getSkeletonCount } from '../../../../test-utils/interactionHelpers';
import { WorkspaceDetailShell } from './WorkspaceDetailShell';
import { waitForSkeletonToDisappear } from '../workspaceTestHelpers';
import { workspacesHandlers, workspacesLoadingHandlers } from '../../../data/mocks/workspaces.handlers';
import { roleBindingsHandlers, roleBindingsLoadingHandlers } from '../../../data/mocks/roleBindings.handlers';
import { staticAssetsHandlers } from '../../../../shared/data/mocks/staticAssets.handlers';
import { DEFAULT_WORKSPACES, WS_DEFAULT, WS_PRODUCTION, WS_ROOT } from '../../../data/mocks/seed';

const withRouter = (Story: React.ComponentType, context: { parameters?: { route?: string } }) => {
  const route = context.parameters?.route || `/iam/access-management/workspaces/detail/${WS_PRODUCTION.id}/direct-roles`;
  return (
    <MemoryRouter initialEntries={[route]}>
      <div style={{ minHeight: '600px' }}>
        <Routes>
          <Route path="/iam/access-management/workspaces/detail/:workspaceId/*" element={<Story />} />
        </Routes>
      </div>
    </MemoryRouter>
  );
};

const defaultHandlers = [...workspacesHandlers(DEFAULT_WORKSPACES), ...roleBindingsHandlers(), ...staticAssetsHandlers()];

const meta: Meta<typeof WorkspaceDetailShell> = {
  component: WorkspaceDetailShell,
  tags: ['ff:platform.rbac.workspaces-role-bindings'],
  decorators: [withRouter],
  parameters: {
    chrome: { environment: 'prod' },
    msw: { handlers: defaultHandlers },
    workspacePermissions: {
      view: DEFAULT_WORKSPACES.map((ws) => ws.id!),
      edit: DEFAULT_WORKSPACES.map((ws) => ws.id!),
      delete: DEFAULT_WORKSPACES.filter((ws) => ws.type !== 'root').map((ws) => ws.id!),
      create: DEFAULT_WORKSPACES.map((ws) => ws.id!),
      move: DEFAULT_WORKSPACES.filter((ws) => ws.type !== 'root').map((ws) => ws.id!),
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  tags: ['autodocs'],
  parameters: {
    route: `/iam/access-management/workspaces/detail/${WS_PRODUCTION.id}/assets`,
    featureFlags: { 'platform.rbac.workspaces-role-bindings': false },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify assets-only view when role-bindings flag is off', async () => {
      await waitForSkeletonToDisappear(canvasElement);
      await expect(canvas.findByText('Assets')).resolves.toBeInTheDocument();
      await expect(canvas.queryByText('Role assignments')).not.toBeInTheDocument();
      const prodElements = await canvas.findAllByText(WS_PRODUCTION.name!);
      await expect(prodElements.length).toBeGreaterThanOrEqual(1);
    });
  },
};

export const WithRolesEnabled: Story = {
  parameters: {
    route: `/iam/access-management/workspaces/detail/${WS_PRODUCTION.id}/direct-roles`,
    featureFlags: { 'platform.rbac.workspaces-role-bindings': true },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify both tabs visible', async () => {
      await waitForSkeletonToDisappear(canvasElement);
      await expect(canvas.findByText('Role assignments')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Assets')).resolves.toBeInTheDocument();
      const prodElements = await canvas.findAllByText(WS_PRODUCTION.name!);
      await expect(prodElements.length).toBeGreaterThanOrEqual(1);
    });
  },
};

export const TabSwitching: Story = {
  parameters: {
    route: `/iam/access-management/workspaces/detail/${WS_PRODUCTION.id}/assets`,
    featureFlags: { 'platform.rbac.workspaces-role-bindings': true },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Switch between Assets and Role assignments tabs', async () => {
      await waitForSkeletonToDisappear(canvasElement);
      const assetsTab = await canvas.findByText('Assets');
      const rolesTab = await canvas.findByText('Role assignments');

      await userEvent.click(rolesTab);
      await userEvent.click(assetsTab);
    });
  },
};

export const LoadingState: Story = {
  parameters: {
    route: `/iam/access-management/workspaces/detail/${WS_PRODUCTION.id}/direct-roles`,
    featureFlags: { 'platform.rbac.workspaces-role-bindings': true },
    msw: { handlers: [...workspacesLoadingHandlers(), ...roleBindingsLoadingHandlers(), ...staticAssetsHandlers()] },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify skeleton loading state', async () => {
      await waitFor(
        () => {
          expect(getSkeletonCount(canvasElement)).toBeGreaterThan(0);
        },
        { timeout: 10000 },
      );
    });
  },
};

export const RootWorkspace: Story = {
  parameters: {
    route: `/iam/access-management/workspaces/detail/${WS_ROOT.id}/assets`,
    featureFlags: { 'platform.rbac.workspaces-role-bindings': false },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify root workspace detail page', async () => {
      await waitForSkeletonToDisappear(canvasElement);
      await expect(canvas.findByText('Assets')).resolves.toBeInTheDocument();
      await expect(canvas.queryByText('Role assignments')).not.toBeInTheDocument();
    });
  },
};

export const InheritedRolesTab: Story = {
  parameters: {
    route: `/iam/access-management/workspaces/detail/${WS_PRODUCTION.id}/inherited-roles`,
    featureFlags: { 'platform.rbac.workspaces-role-bindings': true },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify inherited roles tab renders', async () => {
      await waitForSkeletonToDisappear(canvasElement);
      await expect(canvas.findByText('Roles assigned in parent workspaces')).resolves.toBeInTheDocument();
    });
  },
};

export const RoleAssignmentSubTabSwitching: Story = {
  parameters: {
    route: `/iam/access-management/workspaces/detail/${WS_PRODUCTION.id}/direct-roles`,
    featureFlags: { 'platform.rbac.workspaces-role-bindings': true },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Switch between direct and inherited sub-tabs', async () => {
      await waitForSkeletonToDisappear(canvasElement);
      const thisWsTab = await canvas.findByText('Roles assigned in this workspace');
      const parentWsTab = await canvas.findByText('Roles assigned in parent workspaces');

      await userEvent.click(parentWsTab);
      await userEvent.click(thisWsTab);
    });
  },
};

export const BreadcrumbNoLinkWithoutViewPermission: Story = {
  parameters: {
    route: `/iam/access-management/workspaces/detail/${WS_PRODUCTION.id}/assets`,
    featureFlags: { 'platform.rbac.workspaces-role-bindings': false },
    workspacePermissions: {
      view: [WS_PRODUCTION.id!, WS_DEFAULT.id!],
      edit: [WS_PRODUCTION.id!],
      delete: [WS_PRODUCTION.id!],
      create: [WS_PRODUCTION.id!],
      move: [WS_PRODUCTION.id!],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify breadcrumb root item is not a link when user lacks view permission', async () => {
      await waitForSkeletonToDisappear(canvasElement);
      const rootElements = await canvas.findAllByText(WS_ROOT.name!);
      const hierarchyRoot = rootElements.find((el) => el.closest('.pf-v6-c-breadcrumb__item'));
      await expect(hierarchyRoot).toBeTruthy();
      await expect(hierarchyRoot?.closest('a')).toBeNull();
    });
  },
};
