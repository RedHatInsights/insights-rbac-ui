import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ConversionOptInBanner, type ConversionOptInBannerProps } from './ConversionOptInBanner';
import { DECORATOR_ARG_TYPES, DEFAULT_DECORATOR_ARGS, type StoryArgs } from '../../../.storybook/types';
import messages from '../../Messages';

type BannerStoryArgs = StoryArgs<ConversionOptInBannerProps>;

const meta: Meta<BannerStoryArgs> = {
  component: ConversionOptInBanner,
  tags: ['autodocs', 'ff:platform-conversion.opt-in-banner', 'perm:org-admin'],
  parameters: {
    docs: {
      description: {
        component: `
Prompts org admins to opt-in to Workspace v2. Only visible when the
\`platform-conversion.opt-in-banner\` feature flag is enabled, the user's
identity has loaded, and the user is an org admin.
        `,
      },
    },
    orgAdmin: true,
    featureFlags: { 'platform-conversion.opt-in-banner': true },
  },
  args: {
    onGetStarted: fn(),
    learnMoreUrl: '#',
    ...DEFAULT_DECORATOR_ARGS,
    orgAdmin: true,
  },
  argTypes: {
    onGetStarted: {
      description: 'Callback when "Get started now" is clicked',
      table: { category: 'Events' },
    },
    learnMoreUrl: {
      control: 'text',
      description: 'URL for the "Learn more" link',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"#"' } },
    },
    ...DECORATOR_ARG_TYPES,
  },
};

export default meta;
type Story = StoryObj<BannerStoryArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.findByText(messages.conversionBannerAdminTitle.defaultMessage)).resolves.toBeInTheDocument();
    await expect(canvas.findByText(messages.conversionBannerAdminGetStarted.defaultMessage)).resolves.toBeInTheDocument();
    await expect(canvas.findByText(messages.conversionBannerAdminLearnMore.defaultMessage, { exact: false })).resolves.toBeInTheDocument();
  },
};

export const OnGetStartedCallback: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const getStartedLink = await canvas.findByText(messages.conversionBannerAdminGetStarted.defaultMessage);
    await userEvent.click(getStartedLink);
    await expect(args.onGetStarted).toHaveBeenCalledTimes(1);
  },
};

export const CustomLearnMoreUrl: Story = {
  args: {
    learnMoreUrl: 'https://example.com/benefits',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const learnMoreLink = await canvas.findByText(messages.conversionBannerAdminLearnMore.defaultMessage, { exact: false });
    const anchor = learnMoreLink.closest('a');
    await expect(anchor).toHaveAttribute('href', 'https://example.com/benefits');
    await expect(anchor).toHaveAttribute('target', '_blank');
    await expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
  },
};

export const HiddenWhenFlagDisabled: Story = {
  tags: ['ff:platform-conversion.opt-in-banner'],
  parameters: {
    featureFlags: { 'platform-conversion.opt-in-banner': false },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
  },
};

export const HiddenForNonAdmin: Story = {
  tags: ['perm:org-admin'],
  parameters: {
    orgAdmin: false,
  },
  args: {
    orgAdmin: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
  },
};
