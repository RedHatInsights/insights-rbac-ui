import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { ConversionWizard } from './ConversionWizard';
import { tenantApi } from '../../../shared/data/api/tenant';

// Conversion sends the user to V2 with a full page load, not a client-side navigation.
const mockAssign = vi.fn();

vi.stubGlobal('location', { ...window.location, assign: mockAssign });

vi.mock('../../../shared/data/api/tenant', () => ({
  tenantApi: {
    getEligibility: vi.fn(),
    optIn: vi.fn(),
  },
}));

const getEligibility = vi.mocked(tenantApi.getEligibility);
const optIn = vi.mocked(tenantApi.optIn);

beforeEach(() => {
  vi.clearAllMocks();
  getEligibility.mockResolvedValue({ eligible: true });
  optIn.mockResolvedValue({ v2_opted_in: true });
});

const renderWizard = (props: Partial<React.ComponentProps<typeof ConversionWizard>> = {}) =>
  render(
    <IntlProvider locale="en">
      <MemoryRouter>
        <ConversionWizard onCancel={vi.fn()} onSuccess={vi.fn()} {...props} />
      </MemoryRouter>
    </IntlProvider>,
  );

/** Walks the wizard from the introduction step through to a click on Submit. */
const submitWizard = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /next/i }));
  await user.click(screen.getByRole('button', { name: /next/i }));

  // Pre-conversion checklist requires every checkbox
  for (const checkbox of screen.getAllByRole('checkbox')) {
    await user.click(checkbox);
  }
  await user.click(screen.getByRole('button', { name: /next/i }));

  // Confirm conversion
  await user.click(screen.getByRole('checkbox'));
  await user.click(screen.getByRole('button', { name: /submit/i }));
};

const modalBoxes = () => document.querySelectorAll('.pf-v6-c-modal-box');

describe('ConversionWizard', () => {
  it('renders the wizard inside a single modal', () => {
    renderWizard();

    expect(modalBoxes()).toHaveLength(1);
    expect(document.querySelector('.pf-v6-c-backdrop')).toBeInTheDocument();
    expect(modalBoxes()[0].contains(screen.getByRole('heading', { name: /what changes during conversion/i }))).toBe(true);
  });

  it('keeps the spinner and the success screen in the same modal after submit', async () => {
    const user = userEvent.setup();
    // Hold the request open so the in-flight state can be inspected.
    let release: () => void = () => undefined;
    optIn.mockReturnValue(new Promise((resolve) => (release = () => resolve({ v2_opted_in: true }))));
    renderWizard();

    const modalBox = modalBoxes()[0];
    await submitWizard(user);

    // While the request is in flight the spinner must be inside the wizard's modal,
    // not on the page behind it.
    const spinner = await screen.findByRole('progressbar');
    expect(modalBoxes()).toHaveLength(1);
    expect(modalBoxes()[0]).toBe(modalBox);
    expect(modalBox.contains(spinner)).toBe(true);

    release();

    // The success screen then replaces the spinner in that very same modal.
    const heading = await screen.findByRole('heading', { name: /conversion complete/i }, { timeout: 5000 });
    expect(modalBoxes()).toHaveLength(1);
    expect(modalBoxes()[0]).toBe(modalBox);
    expect(modalBox.contains(heading)).toBe(true);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(modalBox.contains(screen.getByRole('button', { name: /go to access management dashboard/i }))).toBe(true);
  }, 20000);

  it('calls onSuccess and reloads onto the V2 overview when the dashboard button is clicked', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    renderWizard({ onSuccess });

    await submitWizard(user);
    await screen.findByRole('heading', { name: /conversion complete/i }, { timeout: 5000 });

    await user.click(screen.getByRole('button', { name: /go to access management dashboard/i }));

    expect(onSuccess).toHaveBeenCalled();
    expect(mockAssign).toHaveBeenCalledWith('/iam/overview');
  }, 20000);

  it('checks eligibility before opting in', async () => {
    const user = userEvent.setup();
    renderWizard();

    await submitWizard(user);
    await screen.findByRole('heading', { name: /conversion complete/i }, { timeout: 5000 });

    expect(getEligibility).toHaveBeenCalledTimes(1);
    expect(optIn).toHaveBeenCalledTimes(1);
    expect(getEligibility.mock.invocationCallOrder[0]).toBeLessThan(optIn.mock.invocationCallOrder[0]);
  }, 20000);

  it('skips the opt-in call and names the blockers when the tenant is ineligible', async () => {
    const user = userEvent.setup();
    getEligibility.mockResolvedValue({
      eligible: false,
      bootstrapped: false,
      ineligible_custom_roles: [{ uuid: 'r1', name: 'Legacy Auditor', ineligible_applications: ['inventory'] }],
      ineligible_groups: [{ uuid: 'g1', name: 'Platform Admins', ineligible_system_roles: [] }],
    });
    renderWizard();

    await submitWizard(user);

    await screen.findByRole('heading', { name: /conversion failed/i }, { timeout: 5000 });
    expect(screen.getByText(/Legacy Auditor, Platform Admins/)).toBeInTheDocument();
    // An ineligible tenant can only get a 422 back, so the PATCH must never be sent.
    expect(optIn).not.toHaveBeenCalled();
  }, 20000);

  it('shows the server-supplied detail when opting in is rejected', async () => {
    const user = userEvent.setup();
    optIn.mockRejectedValue({
      request: {},
      response: { status: 403, data: { errors: [{ detail: 'You do not have permission to perform this action.', status: '403' }] } },
    });
    renderWizard();

    await submitWizard(user);

    await screen.findByRole('heading', { name: /conversion failed/i }, { timeout: 5000 });
    expect(screen.getByText('You do not have permission to perform this action.')).toBeInTheDocument();
  }, 20000);

  it('falls back to the network message when the request never reaches the server', async () => {
    const user = userEvent.setup();
    getEligibility.mockRejectedValue({ request: {} });
    renderWizard();

    await submitWizard(user);

    await screen.findByRole('heading', { name: /conversion failed/i }, { timeout: 5000 });
    expect(screen.getByText(/network error occurred/i)).toBeInTheDocument();
    expect(optIn).not.toHaveBeenCalled();
  }, 20000);
});
