import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { IntlProvider } from 'react-intl';
import { Overview } from './OverviewContent';

// Conversion sends the user to V2 with a full page load, not a client-side navigation.
const mockAssign = vi.fn();

vi.stubGlobal('location', { ...window.location, assign: mockAssign });

vi.mock('../../../shared/hooks/useIdentity', () => ({
  useIdentity: () => ({ ready: true, orgAdmin: true, entitlements: {} }),
}));

vi.mock('../../../capabilities/useConversionOptIn', () => ({
  useConversionOptIn: () => true,
}));

vi.mock('../../../capabilities/useWorkspacesFlag', () => ({
  useWorkspacesFlag: () => false,
  useWorkspacesEligibility: () => false,
}));

// The wizard's own behaviour is covered by its tests; here it only needs to be able to report
// success, so the page's response to that can be checked.
vi.mock('../../components/conversion-wizard/ConversionWizard', () => ({
  ConversionWizard: ({ onSuccess }: { onSuccess?: () => void }) => <button onClick={onSuccess}>finish conversion</button>,
}));

vi.mock('./components/GetStartedCard', () => ({ GetStartedCard: () => null }));
vi.mock('./components/SupportingFeaturesSection', () => ({ SupportingFeaturesSection: () => null }));
vi.mock('./components/RecommendedContentTable', () => ({ RecommendedContentTable: () => null }));

const renderOverview = () =>
  render(
    <IntlProvider locale="en">
      <Overview links={{ groups: '/groups', roles: '/roles' }} />
    </IntlProvider>,
  );

describe('OverviewContent', () => {
  beforeEach(() => {
    mockAssign.mockClear();
  });

  it('reloads onto the V2 overview once the conversion wizard reports success', async () => {
    const user = userEvent.setup();
    renderOverview();

    await user.click(screen.getByRole('button', { name: /get started/i }));
    await user.click(await screen.findByRole('button', { name: /finish conversion/i }));

    expect(mockAssign).toHaveBeenCalledWith('/iam/overview');
  });
});
