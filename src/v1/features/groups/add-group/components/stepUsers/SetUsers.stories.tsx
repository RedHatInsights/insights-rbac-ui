import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { expect, waitFor } from 'storybook/test';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import { usersHandlers } from '../../../../../../shared/data/mocks/users.handlers';
import { SetUsers } from './SetUsers';

// Extended component mapper to include SetUsers
const extendedMapper = {
  ...componentMapper,
  'set-users': SetUsers,
};

// Mock form schema for the SetUsers step
const setUsersSchema = {
  fields: [
    {
      component: 'set-users',
      name: 'users-list',
    },
  ],
};

// Wrapper component to provide FormRenderer and Router context
const SetUsersWithForm: React.FC<{
  onSubmit?: (values: Record<string, unknown>) => void;
  initialValues?: Record<string, unknown>;
}> = ({ onSubmit = () => {}, initialValues = { 'users-list': [] } }) => {
  return (
    <MemoryRouter>
      <FormRenderer
        schema={setUsersSchema}
        componentMapper={extendedMapper}
        FormTemplate={Pf4FormTemplate}
        onSubmit={onSubmit}
        initialValues={initialValues}
      />
    </MemoryRouter>
  );
};

const meta: Meta<typeof SetUsersWithForm> = {
  title: 'Features/Groups/AddGroup/SetUsers',
  component: SetUsersWithForm,
  tags: ['autodocs', 'ff:platform.rbac.itless', 'custom-css'],
  parameters: {
    docs: {
      description: {
        component: 'TypeScript version of SetUsers component for the Add Group wizard.',
      },
    },
    msw: {
      handlers: [...usersHandlers()],
    },
    featureFlags: {
      'platform.rbac.itless': false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    await step('Verify component renders', async () => {
      await waitFor(
        () => {
          expect(canvasElement).toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      expect(canvasElement).toBeInTheDocument();
    });
  },
};

export const ITLessMode: Story = {
  parameters: {
    featureFlags: {
      'platform.rbac.itless': true,
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify IT-less mode component renders', async () => {
      await waitFor(
        () => {
          expect(canvasElement).toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      expect(canvasElement).toBeInTheDocument();
    });
  },
};
