import { expect, userEvent, within } from 'storybook/test';
import { Workspace } from '../../redux/workspaces/reducer';

// Shared mock data for workspace tests
export const mockWorkspaces: Workspace[] = [
  {
    id: 'root-1',
    name: 'Root Workspace',
    description: 'Root workspace container',
    parent_id: '',
    type: 'root',
  },
  {
    id: '1',
    name: 'Production Environment',
    description: 'Main production workspace for live applications',
    parent_id: 'root-1',
    type: 'standard',
  },
  {
    id: '2',
    name: 'Development Environment',
    description: 'Development workspace for testing and staging',
    parent_id: 'root-1',
    type: 'standard',
  },
];

// Reusable test functions that can be shared between table and container stories
export const testDefaultWorkspaceDisplay = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);

  // Verify page structure
  await expect(canvas.getByText('Workspaces')).toBeInTheDocument();
  await expect(canvas.getByText('Create workspace')).toBeInTheDocument();

  // Verify workspace data is displayed
  await expect(canvas.getByText('Root Workspace')).toBeInTheDocument();
  await expect(canvas.getByText('Production Environment')).toBeInTheDocument();
  await expect(canvas.getByText('Development Environment')).toBeInTheDocument();

  // Verify action menus are present
  const kebabButtons = canvas.getAllByLabelText('Kebab toggle');
  expect(kebabButtons.length).toBeGreaterThan(0);

  // Click to open menu
  await userEvent.click(kebabButtons[0]);

  // Verify menu structure exists
  await expect(canvas.getByText('Edit workspace')).toBeInTheDocument();
  await expect(canvas.getByText('Delete workspace')).toBeInTheDocument();
  await expect(canvas.getByText('Move workspace')).toBeInTheDocument();
  await expect(canvas.getByText('Manage integrations')).toBeInTheDocument();

  // Verify primary toolbar button exists and is functional
  const primaryButton = canvas.getByRole('button', { name: /create workspace/i });
  expect(primaryButton).toHaveClass('pf-m-primary');
  expect(primaryButton).not.toBeDisabled();
};

export const testLoadingState = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  await expect(canvas.getByText('Workspaces')).toBeInTheDocument();
  // Check for skeleton loading elements
  const skeletonElements = document.querySelectorAll('.pf-v5-c-skeleton');
  expect(skeletonElements.length).toBeGreaterThan(0);
};

export const testEmptyState = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  await expect(canvas.getByText('Workspaces')).toBeInTheDocument();
  await expect(canvas.getByText('No workspaces found')).toBeInTheDocument();
};

export const testErrorState = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  await expect(canvas.getByText('Failed to load workspaces')).toBeInTheDocument();
  // Error state should not show the normal page header
  await expect(canvas.queryByText('Workspaces')).not.toBeInTheDocument();
};
