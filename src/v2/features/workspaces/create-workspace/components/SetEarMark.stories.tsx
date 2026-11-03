import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import { SetEarMark } from './SetEarMark';
import { BUNDLES, WORKSPACE_ACCOUNT } from '../constants';

const FEATURE = BUNDLES[0];
const EARMARK_FIELD = `ear-mark-${FEATURE.value}-cores`;
const BILLING_ACCOUNT = '100020003000';
const CORE_COUNT = 42;
const LARGE_CORE_COUNT = 1234;

interface WrapperProps {
  coreCount: number;
}

/**
 * Renders SetEarMark inside a minimal Data Driven Forms wizard step, mirroring
 * the field wiring from create-workspace/schema.tsx (component, name, feature)
 * and the form values the wizard step receives (billing account, earmark cores).
 */
const SetEarMarkWithForm = ({ coreCount }: WrapperProps) => (
  <FormRenderer
    componentMapper={{ ...componentMapper, SetEarMark }}
    FormTemplate={(props) => <Pf4FormTemplate {...props} showFormControls={false} />}
    schema={{
      fields: [
        {
          component: 'SetEarMark',
          name: EARMARK_FIELD,
          feature: FEATURE,
          isRequired: true,
        },
      ],
    }}
    onSubmit={() => {}}
    initialValues={{
      [WORKSPACE_ACCOUNT]: BILLING_ACCOUNT,
      [EARMARK_FIELD]: coreCount,
    }}
  />
);

const meta: Meta<typeof SetEarMarkWithForm> = {
  component: SetEarMarkWithForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**SetEarMark** is the wizard step that sets the core earmark for a billing feature
(\`ear-mark-<feature>-cores\`), behind \`platform.rbac.workspaces-billing-features\`.

The step renders the billing account's total availability with a locale-formatted
core count (\`{count, number}\` in the \`totalAccountAvailability\` message), so these
stories verify the number formatting renders correctly for both a plain count and
a count that requires grouping separators.
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', maxWidth: '600px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SetEarMarkWithForm>;

/**
 * Default: plain core count.
 * Verifies the step title and the availability line with the un-grouped count.
 */
export const Default: Story = {
  tags: ['autodocs'],
  args: { coreCount: CORE_COUNT },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify earmark title and availability text', async () => {
      await expect(canvas.findByText(`Set ear mark for ${FEATURE.label} features`)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(`Total availability from ${BILLING_ACCOUNT}: ${CORE_COUNT} Cores`)).resolves.toBeInTheDocument();
      await expect(canvas.findByRole('spinbutton')).resolves.toBeInTheDocument();
    });
  },
};

/**
 * Large core count: the count requires a grouping separator in English.
 * Verifies the {count, number} argument formats the count locale-aware
 * ("1,234" — a raw {count} would render "1234").
 */
export const LargeCoreCount: Story = {
  args: { coreCount: LARGE_CORE_COUNT },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify grouped number formatting in availability text', async () => {
      await expect(canvas.findByText(`Total availability from ${BILLING_ACCOUNT}: 1,234 Cores`)).resolves.toBeInTheDocument();
    });
  },
};
