import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { RolesSelectionTable } from './RolesSelectionTable';
import { v2RolesHandlers } from '../../../../data/mocks/roles.handlers';
import { DEFAULT_V2_ROLES, DEFAULT_V2_ROLE_PERMISSIONS, V2_ROLE_TENANT_ADMIN } from '../../../../data/mocks/seed';
import { TEST_TIMEOUTS } from '../../../../../test-utils/testUtils';
import { findCompoundExpandButton } from '../../../../../test-utils/tableHelpers';

const FIRST_ROLE = V2_ROLE_TENANT_ADMIN;
const FIRST_ROLE_PERMISSIONS = DEFAULT_V2_ROLE_PERMISSIONS[FIRST_ROLE.id!];

const onRoleSelectionSpy = fn();
const readRoleSpy = fn();

const meta: Meta<typeof RolesSelectionTable> = {
  component: RolesSelectionTable,
  args: {
    roles: DEFAULT_V2_ROLES,
    selectedRoles: [],
    onRoleSelection: onRoleSelectionSpy,
  },
  parameters: {
    msw: {
      handlers: [...v2RolesHandlers(undefined, { onRead: readRoleSpy })],
    },
  },
};

export default meta;
type Story = StoryObj<typeof RolesSelectionTable>;

export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Table renders with role data', async () => {
      await waitFor(
        () => {
          expect(canvas.queryByText(FIRST_ROLE.name!)).toBeInTheDocument();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );

      expect(canvas.queryByText(String(FIRST_ROLE.permissions_count))).toBeInTheDocument();
    });
  },
};

export const CompoundExpansion: Story = {
  name: 'Expand permissions',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    readRoleSpy.mockClear();

    await step('Wait for table to render', async () => {
      await waitFor(
        () => {
          expect(canvas.queryByText(FIRST_ROLE.name!)).toBeInTheDocument();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });

    await step('Click permissions count to expand', async () => {
      const expandButton = findCompoundExpandButton(canvas, FIRST_ROLE.name!, 'Permissions');
      await user.click(expandButton);
    });

    await step('Expanded area shows permissions fetched from detail API', async () => {
      const firstPerm = FIRST_ROLE_PERMISSIONS[0];
      const expectedText = `${firstPerm.application}:${firstPerm.resource_type}:${firstPerm.operation}`;

      await waitFor(
        () => {
          expect(canvas.queryByText(expectedText)).toBeInTheDocument();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );

      expect(readRoleSpy).toHaveBeenCalledWith(FIRST_ROLE.id);

      for (const perm of FIRST_ROLE_PERMISSIONS) {
        expect(canvas.queryByText(`${perm.application}:${perm.resource_type}:${perm.operation}`)).toBeInTheDocument();
      }
    });

    await step('Click again to collapse', async () => {
      const expandButton = findCompoundExpandButton(canvas, FIRST_ROLE.name!, 'Permissions');
      await user.click(expandButton);

      const firstPerm = FIRST_ROLE_PERMISSIONS[0];
      const expectedText = `${firstPerm.application}:${firstPerm.resource_type}:${firstPerm.operation}`;

      await waitFor(() => {
        expect(canvas.queryByText(expectedText)).not.toBeInTheDocument();
      });
    });
  },
};
