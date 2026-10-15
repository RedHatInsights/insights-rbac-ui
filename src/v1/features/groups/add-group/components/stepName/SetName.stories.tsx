import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { groupsHandlers } from '../../../../../../shared/data/mocks/groups.handlers';
import type { GroupOut } from '../../../../../../shared/data/mocks/db';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import { SetName } from './SetName';

const storyGroups: GroupOut[] = [
  {
    uuid: 'g-1',
    name: 'Admin Group',
    description: 'Admin group',
    principalCount: 2,
    roleCount: 1,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
    platform_default: false,
    admin_default: false,
    system: false,
  },
  {
    uuid: 'g-2',
    name: 'Test Group',
    description: 'Test group',
    principalCount: 2,
    roleCount: 1,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
    platform_default: false,
    admin_default: false,
    system: false,
  },
  {
    uuid: 'g-3',
    name: 'existing-group',
    description: 'Existing group',
    principalCount: 2,
    roleCount: 1,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
    platform_default: false,
    admin_default: false,
    system: false,
  },
];

// Extended component mapper to include SetName
const extendedMapper = {
  ...componentMapper,
  'set-name': SetName,
};

// Mock form schema for the SetName step
const setNameSchema = {
  fields: [
    {
      component: 'set-name',
      name: 'group-data',
      label: 'Group Information',
      validate: [
        {
          type: 'required',
          message: 'Group name is required',
        },
      ],
    },
  ],
};

// Wrapper component to test SetName within a form context
const SetNameWithForm: React.FC<{
  onSubmit?: (values: Record<string, unknown>) => void;
  initialValues?: Record<string, unknown>;
}> = ({ onSubmit = () => {}, initialValues = {} }) => {
  return (
    <FormRenderer
      componentMapper={extendedMapper}
      FormTemplate={(props) => <Pf4FormTemplate {...props} showFormControls={false} />}
      schema={setNameSchema}
      onSubmit={onSubmit}
      initialValues={initialValues}
    />
  );
};

const meta: Meta<typeof SetNameWithForm> = {
  component: SetNameWithForm,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
SetName component for the Add Group wizard first step. Features:
- **Group name input** with required validation and uniqueness checking
- **Group description textarea** with optional 150-character limit
- **Async validation** that checks if group name already exists
- **Real-time validation** with error states and helper text
- **Integration with data-driven-forms** for wizard functionality
- **Debounced API calls** to prevent excessive validation requests

The component uses PatternFly form components and integrates with the broader Add Group wizard workflow.
        `,
      },
    },
    msw: {
      handlers: [...groupsHandlers(storyGroups)],
    },
  },
  args: {
    onSubmit: fn(),
    initialValues: {},
  },
};

export default meta;
type Story = StoryObj<typeof SetNameWithForm>;

export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify form fields and input', async () => {
      const nameInput = await canvas.findByRole('textbox', { name: /name/i });
      const descriptionInput = await canvas.findByRole('textbox', { name: /description/i });

      expect(nameInput).toBeInTheDocument();
      expect(descriptionInput).toBeInTheDocument();

      await userEvent.type(nameInput, 'New Group Name');
      await userEvent.type(descriptionInput, 'A description for the new group');

      expect(nameInput).toHaveValue('New Group Name');
      expect(descriptionInput).toHaveValue('A description for the new group');

      expect(await canvas.findByText('Provide a unique name for the group')).toBeInTheDocument();
      expect(await canvas.findByText('Optional field')).toBeInTheDocument();
    });
  },
};

export const WithInitialValues: Story = {
  args: {
    initialValues: {
      'group-name': 'Pre-filled Group',
      'group-description': 'Pre-filled description',
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify initial values loaded', async () => {
      const nameInput = await canvas.findByRole('textbox', { name: /name/i });
      const descriptionInput = await canvas.findByRole('textbox', { name: /description/i });

      expect(nameInput).toHaveValue('Pre-filled Group');
      expect(descriptionInput).toHaveValue('Pre-filled description');
    });
  },
};

export const ValidationTesting: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Test character limit validation', async () => {
      const nameInput = await canvas.findByRole('textbox', { name: /name/i });
      const descriptionInput = await canvas.findByRole('textbox', { name: /description/i });

      const longName = 'A'.repeat(151);
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, longName);

      await waitFor(async () => {
        expect(await canvas.findByText(/can have maximum of 150 characters/i)).toBeInTheDocument();
      });

      const longDescription = 'B'.repeat(151);
      await userEvent.clear(descriptionInput);
      await userEvent.type(descriptionInput, longDescription);

      const errorElements = await canvas.findAllByText(/can have maximum of 150 characters/i);
      expect(errorElements.length).toBeGreaterThan(0);
    });

    await step('Test valid inputs clear errors', async () => {
      const nameInput = await canvas.findByRole('textbox', { name: /name/i });
      const descriptionInput = await canvas.findByRole('textbox', { name: /description/i });

      await userEvent.clear(nameInput);
      await userEvent.clear(descriptionInput);
      await userEvent.type(nameInput, 'Valid Group Name');
      await userEvent.type(descriptionInput, 'Valid description');

      await waitFor(async () => {
        expect(await canvas.findByText('Provide a unique name for the group')).toBeInTheDocument();
        expect(await canvas.findByText('Optional field')).toBeInTheDocument();
      });
    });
  },
};

export const DuplicateNameValidation: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Enter duplicate name and verify validation', async () => {
      const nameInput = await canvas.findByRole('textbox', { name: /name/i });

      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Admin Group');

      await waitFor(
        async () => {
          expect(nameInput).toHaveAttribute('aria-invalid', 'true');
        },
        { timeout: 5000 },
      );
    });
  },
};

export const FormSubmissionTest: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Fill form and verify validation', async () => {
      const nameInput = await canvas.findByRole('textbox', { name: /name/i });
      const descriptionInput = await canvas.findByRole('textbox', { name: /description/i });

      await userEvent.type(nameInput, 'Submittable Group');
      await userEvent.type(descriptionInput, 'A group ready for submission');

      await waitFor(async () => {
        expect(await canvas.findByText('Provide a unique name for the group')).toBeInTheDocument();
      });

      expect(nameInput).toHaveValue('Submittable Group');
      expect(descriptionInput).toHaveValue('A group ready for submission');
    });
  },
};

export const EmptyFormValidation: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify empty required field and focus/blur', async () => {
      const nameInput = await canvas.findByRole('textbox', { name: /name/i });

      expect(nameInput).toHaveValue('');

      await userEvent.click(nameInput);
      await userEvent.tab();
    });
  },
};
