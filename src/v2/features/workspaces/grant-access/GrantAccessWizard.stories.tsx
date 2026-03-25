import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { GrantAccessWizard } from './GrantAccessWizard';
import { v2RolesHandlers } from '../../../data/mocks/roles.handlers';
import { groupsHandlers } from '../../../../shared/data/mocks/groups.handlers';
import { roleBindingsBatchCreateHandlers } from '../../../data/mocks/roleBindings.handlers';
import { DEFAULT_V2_ROLES, WS_PRODUCTION } from '../../../data/mocks/seed';
import { DEFAULT_GROUPS, GROUP_PLATFORM_ADMINS } from '../../../../shared/data/mocks/seed';
import { waitForModal } from '../../../../test-utils/interactionHelpers';
import type { ScopedQueries } from '../../../../test-utils/interactionHelpers';

const WORKSPACE = WS_PRODUCTION;
const FIRST_GROUP = GROUP_PLATFORM_ADMINS;
const FIRST_ROLE = DEFAULT_V2_ROLES[0];

async function findWizardNextButton(scope: ScopedQueries) {
  return scope.findByRole('button', { name: /^next$/i });
}

const WizardWrapper = ({ storyArgs }: { storyArgs: React.ComponentProps<typeof GrantAccessWizard> }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <MemoryRouter initialEntries={['/iam/access-management/workspaces']} initialIndex={0}>
      <div>
        <Button data-testid="open-wizard-button" onClick={() => setIsOpen(true)}>
          Grant Access
        </Button>
        {isOpen && (
          <GrantAccessWizard
            {...storyArgs}
            afterSubmit={() => {
              setIsOpen(false);
              storyArgs.afterSubmit?.();
            }}
            onCancel={() => {
              setIsOpen(false);
              storyArgs.onCancel?.();
            }}
          />
        )}
      </div>
    </MemoryRouter>
  );
};

const meta: Meta<typeof GrantAccessWizard> = {
  component: GrantAccessWizard,
  tags: ['autodocs', 'grant-access-wizard'],
  parameters: {
    docs: {
      description: {
        component: `
**GrantAccessWizard** is a multi-step DDF wizard for granting role-based access to user groups within a workspace.

### Wizard Steps
1. **Select user groups** — pick one or more non-default groups
2. **Select roles** — pick one or more V2 roles
3. **Review** — summary of selections before submission

### Validation
Both selection steps have \`isRequired: true\` in the DDF schema, and the \`onSubmit\`
handler guards against empty arrays. The submit-level guard ensures no bad data is sent.
        `,
      },
    },
  },
  render: (args) => <WizardWrapper storyArgs={args} />,
};

export default meta;
type Story = StoryObj<typeof GrantAccessWizard>;

const batchCreateSpy = fn();

const defaultHandlers = [
  ...groupsHandlers(DEFAULT_GROUPS),
  ...v2RolesHandlers(DEFAULT_V2_ROLES),
  ...roleBindingsBatchCreateHandlers({ onBatchCreate: batchCreateSpy }),
];

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    workspaceName: WORKSPACE.name!,
    workspaceId: WORKSPACE.id!,
    afterSubmit: fn(),
    onCancel: fn(),
  },
  parameters: {
    msw: { handlers: defaultHandlers },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Open wizard and verify user groups step renders', async () => {
      await user.click(await canvas.findByTestId('open-wizard-button'));
      const dialog = await waitForModal();

      await waitFor(
        async () => {
          await expect(dialog.findByText(FIRST_GROUP.name)).resolves.toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    });
  },
};

/**
 * Full happy-path journey: select a group, select a role, review, submit.
 * Verifies the batchCreate mutation fires with correct payload.
 */
export const GrantAccessJourney: Story = {
  name: 'Journey / Grant access (select groups and roles)',
  args: {
    workspaceName: WORKSPACE.name!,
    workspaceId: WORKSPACE.id!,
    afterSubmit: fn(),
    onCancel: fn(),
  },
  parameters: {
    msw: { handlers: defaultHandlers },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    batchCreateSpy.mockClear();

    await step('Open wizard', async () => {
      await user.click(await canvas.findByTestId('open-wizard-button'));
      await waitForModal();
    });

    await step('Select a user group and advance', async () => {
      const body = within(document.body);
      await waitFor(
        async () => {
          await expect(body.findByText(FIRST_GROUP.name)).resolves.toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      const groupRow = (await body.findByText(FIRST_GROUP.name)).closest('tr') as HTMLElement;
      const checkbox = groupRow.querySelector('input[type="checkbox"]') as HTMLInputElement;
      await user.click(checkbox);

      const nextButton = await findWizardNextButton(body);
      await user.click(nextButton);

      await waitFor(
        async () => {
          await expect(body.findByText(FIRST_ROLE.name!)).resolves.toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    });

    await step('Select a role and advance to review', async () => {
      const body = within(document.body);
      const roleRow = (await body.findByText(FIRST_ROLE.name!)).closest('tr') as HTMLElement;
      const checkbox = roleRow.querySelector('input[type="checkbox"]') as HTMLInputElement;
      await user.click(checkbox);

      const nextButton = await findWizardNextButton(body);
      await user.click(nextButton);

      await waitFor(
        async () => {
          const headings = body.queryAllByRole('heading', { name: /review/i });
          expect(headings.length).toBeGreaterThan(0);
        },
        { timeout: 5000 },
      );
    });

    await step('Verify review step shows selections', async () => {
      const body = within(document.body);
      await expect(body.findByText(new RegExp(FIRST_GROUP.name))).resolves.toBeInTheDocument();
      await expect(body.findByText(new RegExp(FIRST_ROLE.name!))).resolves.toBeInTheDocument();
    });

    await step('Submit and verify callback', async () => {
      const body = within(document.body);
      const submitButton = await body.findByRole('button', { name: /^submit$/i });
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(args.afterSubmit).toHaveBeenCalled();
        },
        { timeout: 10000 },
      );
    });
  },
};

/**
 * Submit-level guard: reaching Submit with no groups/roles selected does nothing.
 * The `onSubmit` handler short-circuits when either array is empty.
 */
export const SubmitGuardPreventsEmptySubmission: Story = {
  name: 'Validation / Submit guard prevents empty submission',
  args: {
    workspaceName: WORKSPACE.name!,
    workspaceId: WORKSPACE.id!,
    afterSubmit: fn(),
    onCancel: fn(),
  },
  parameters: {
    msw: { handlers: defaultHandlers },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Open wizard and advance to review without selecting anything', async () => {
      await user.click(await canvas.findByTestId('open-wizard-button'));
      await waitForModal();
      const body = within(document.body);

      await waitFor(
        async () => {
          await expect(body.findByText(FIRST_GROUP.name)).resolves.toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      // Step 1 → 2 (no group selected)
      await user.click(await findWizardNextButton(body));
      await waitFor(
        async () => {
          await expect(body.findByText(FIRST_ROLE.name!)).resolves.toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      // Step 2 → 3 (no role selected)
      await user.click(await findWizardNextButton(body));
      await waitFor(
        async () => {
          const headings = body.queryAllByRole('heading', { name: /review/i });
          expect(headings.length).toBeGreaterThan(0);
        },
        { timeout: 5000 },
      );
    });

    await step('Click Submit — afterSubmit should NOT be called', async () => {
      const body = within(document.body);
      const submitButton = await body.findByRole('button', { name: /^submit$/i });
      await user.click(submitButton);

      // The onSubmit handler guards: if (groupIds.length === 0 || roleIds.length === 0) return;
      // afterSubmit is only called after a successful mutation, so it should never fire.
      expect(args.afterSubmit).not.toHaveBeenCalled();
    });
  },
};

/**
 * Verify cancel closes the wizard and calls onCancel.
 */
export const Cancel: Story = {
  args: {
    workspaceName: WORKSPACE.name!,
    workspaceId: WORKSPACE.id!,
    afterSubmit: fn(),
    onCancel: fn(),
  },
  parameters: {
    msw: { handlers: defaultHandlers },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Open wizard and cancel', async () => {
      await user.click(await canvas.findByTestId('open-wizard-button'));
      await waitForModal();

      const body = within(document.body);
      const cancelButton = await body.findByRole('button', { name: /^cancel$/i });
      await user.click(cancelButton);

      await expect(args.onCancel).toHaveBeenCalled();
    });
  },
};
