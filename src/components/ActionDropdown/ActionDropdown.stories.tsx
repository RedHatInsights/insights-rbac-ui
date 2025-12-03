import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ActionDropdown } from './ActionDropdown';

const onEditSpy = fn();
const onDeleteSpy = fn();
const onRemoveSpy = fn();

const meta: Meta<typeof ActionDropdown> = {
  title: 'Components/ActionDropdown',
  component: ActionDropdown,
  parameters: {
    docs: {
      description: {
        component: `
A reusable kebab menu dropdown for row actions and bulk actions.
Consolidates the repeated dropdown pattern found across table components.

## Features
- Kebab (ellipsis) icon toggle
- Configurable action items with onClick, isDisabled, and labels
- OUIA IDs for testing
- Accessible aria-labels
- Auto-close on selection
- Focus management

## Usage

\`\`\`tsx
<ActionDropdown
  ariaLabel="Actions for User 1"
  items={[
    { key: 'edit', label: 'Edit', onClick: () => handleEdit() },
    { key: 'delete', label: 'Delete', onClick: () => handleDelete(), isDanger: true },
  ]}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    items: {
      description: 'Array of action items to display in the dropdown',
    },
    ariaLabel: {
      description: 'Accessible label for the toggle button',
    },
    ouiaId: {
      description: 'OUIA component ID for testing',
    },
    isDisabled: {
      description: 'Whether the dropdown is disabled',
      control: 'boolean',
    },
    shouldFocusToggleOnSelect: {
      description: 'Whether to focus the toggle on select',
      control: 'boolean',
    },
    position: {
      description: 'Position of the dropdown menu',
      control: 'select',
      options: ['right', 'left', 'center', 'start', 'end'],
    },
  },
  beforeEach: () => {
    onEditSpy.mockClear();
    onDeleteSpy.mockClear();
    onRemoveSpy.mockClear();
  },
};

export default meta;
type Story = StoryObj<typeof ActionDropdown>;

/**
 * Default row actions dropdown with Edit and Delete options.
 */
export const Default: Story = {
  args: {
    ariaLabel: 'Actions for row',
    items: [
      { key: 'edit', label: 'Edit', onClick: onEditSpy },
      { key: 'delete', label: 'Delete', onClick: onDeleteSpy },
    ],
    ouiaId: 'row-actions',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find and click the toggle
    const toggle = canvas.getByRole('button', { name: /actions for row/i });
    expect(toggle).toBeInTheDocument();

    await userEvent.click(toggle);

    // Verify dropdown items are visible
    expect(canvas.getByRole('menuitem', { name: /edit/i })).toBeInTheDocument();
    expect(canvas.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument();

    // Click edit and verify callback
    await userEvent.click(canvas.getByRole('menuitem', { name: /edit/i }));
    expect(onEditSpy).toHaveBeenCalledTimes(1);
  },
};

/**
 * Single action dropdown (e.g., Remove only).
 */
export const SingleAction: Story = {
  args: {
    ariaLabel: 'Actions for member',
    items: [{ key: 'remove', label: 'Remove', onClick: onRemoveSpy }],
    ouiaId: 'member-actions',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: /actions for member/i }));
    await userEvent.click(canvas.getByRole('menuitem', { name: /remove/i }));

    expect(onRemoveSpy).toHaveBeenCalledTimes(1);
  },
};

/**
 * Dropdown with disabled actions.
 */
export const WithDisabledActions: Story = {
  args: {
    ariaLabel: 'Actions for row',
    items: [
      { key: 'edit', label: 'Edit', onClick: onEditSpy, isDisabled: true },
      { key: 'delete', label: 'Delete', onClick: onDeleteSpy },
    ],
    ouiaId: 'disabled-actions',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: /actions for row/i }));

    // Verify edit item is disabled
    const editItem = canvas.getByRole('menuitem', { name: /edit/i });
    expect(editItem).toBeDisabled();

    // Verify delete item is enabled
    const deleteItem = canvas.getByRole('menuitem', { name: /delete/i });
    expect(deleteItem).not.toBeDisabled();
  },
};

/**
 * Dropdown with danger action styling.
 */
export const WithDangerAction: Story = {
  args: {
    ariaLabel: 'Actions for row',
    items: [
      { key: 'edit', label: 'Edit', onClick: onEditSpy },
      { key: 'delete', label: 'Delete', onClick: onDeleteSpy, isDanger: true },
    ],
    ouiaId: 'danger-actions',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: /actions for row/i }));

    // Delete should have danger styling
    const deleteItem = canvas.getByRole('menuitem', { name: /delete/i });
    expect(deleteItem).toBeInTheDocument();

    await userEvent.click(deleteItem);
    expect(onDeleteSpy).toHaveBeenCalledTimes(1);
  },
};

/**
 * Dropdown with action descriptions.
 */
export const WithDescriptions: Story = {
  args: {
    ariaLabel: 'Actions for row',
    items: [
      { key: 'edit', label: 'Edit', onClick: onEditSpy, description: 'Modify this item' },
      { key: 'delete', label: 'Delete', onClick: onDeleteSpy, description: 'Permanently remove', isDanger: true },
    ],
    ouiaId: 'description-actions',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: /actions for row/i }));

    expect(canvas.getByText('Modify this item')).toBeInTheDocument();
    expect(canvas.getByText('Permanently remove')).toBeInTheDocument();
  },
};

/**
 * Disabled dropdown toggle.
 */
export const DisabledToggle: Story = {
  args: {
    ariaLabel: 'Actions for row',
    items: [
      { key: 'edit', label: 'Edit', onClick: onEditSpy },
      { key: 'delete', label: 'Delete', onClick: onDeleteSpy },
    ],
    isDisabled: true,
    ouiaId: 'disabled-toggle',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const toggle = canvas.getByRole('button', { name: /actions for row/i });
    expect(toggle).toBeDisabled();
  },
};

/**
 * Empty items array renders nothing.
 */
export const EmptyItems: Story = {
  args: {
    ariaLabel: 'Actions for row',
    items: [],
    ouiaId: 'empty-actions',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should not render any button
    expect(canvas.queryByRole('button')).not.toBeInTheDocument();
  },
};

/**
 * Bulk actions dropdown (multiple items selected).
 */
export const BulkActions: Story = {
  args: {
    ariaLabel: 'Bulk actions',
    items: [
      { key: 'edit', label: 'Edit', onClick: onEditSpy, isDisabled: true, description: 'Select exactly one item' },
      { key: 'delete', label: 'Delete selected', onClick: onDeleteSpy, isDanger: true },
    ],
    ouiaId: 'bulk-actions',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: /bulk actions/i }));

    // Edit should be disabled, delete should be enabled
    expect(canvas.getByRole('menuitem', { name: /edit/i })).toBeDisabled();
    expect(canvas.getByRole('menuitem', { name: /delete selected/i })).not.toBeDisabled();
  },
};

/**
 * Row actions with OUIA IDs for testing.
 */
export const WithOuiaIds: Story = {
  args: {
    ariaLabel: 'Actions for User 1',
    items: [
      { key: 'edit', label: 'Edit', onClick: onEditSpy, ouiaId: 'user-1-edit' },
      { key: 'delete', label: 'Delete', onClick: onDeleteSpy, ouiaId: 'user-1-delete' },
    ],
    ouiaId: 'user-1-actions',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Toggle should exist
    const toggle = canvas.getByRole('button', { name: /actions for user 1/i });
    expect(toggle).toBeInTheDocument();

    await userEvent.click(toggle);

    // Menu items should be visible
    expect(canvas.getByRole('menuitem', { name: /edit/i })).toBeInTheDocument();
    expect(canvas.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument();
  },
};
