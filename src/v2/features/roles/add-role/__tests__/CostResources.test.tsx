import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { IntlProvider } from 'react-intl';
import CostResources from '../CostResources';
import { useResourceTypesQuery } from '../../../../../shared/data/queries/cost';
import { useQueries } from '@tanstack/react-query';

const mockChange = vi.fn();
const mockInputOnChange = vi.fn();
let formValues: Record<string, unknown> = {
  'add-permissions-table': [{ uuid: 'cost-management:aws.cost:read' }],
  'resource-definitions': [],
};

vi.mock('@data-driven-forms/react-form-renderer/use-field-api', () => ({
  default: () => ({
    input: {
      onChange: mockInputOnChange,
      value: [],
    },
  }),
}));

vi.mock('@data-driven-forms/react-form-renderer/use-form-api', () => ({
  default: () => ({
    change: mockChange,
    getState: () => ({ values: formValues }),
  }),
}));

vi.mock('../../../../../shared/contexts/ServiceContext', () => ({
  useAppServices: () => ({ axios: {} }),
}));

vi.mock('../../../../../shared/data/queries/cost', () => ({
  costKeys: {
    resourceDetail: vi.fn((params) => ['cost', 'resource', params]),
  },
  getResource: vi.fn(),
  useResourceTypesQuery: vi.fn(),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQueries: vi.fn(),
  };
});

const renderWithIntl = (component: React.ReactElement) => {
  return render(<IntlProvider locale="en">{component}</IntlProvider>);
};

describe('v2 CostResources', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    formValues = {
      'add-permissions-table': [{ uuid: 'cost-management:aws.cost:read' }],
      'resource-definitions': [],
    };
  });

  it('shows loading state when resource types or resource queries are loading', () => {
    vi.mocked(useResourceTypesQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useResourceTypesQuery>);

    vi.mocked(useQueries).mockReturnValue([]);

    renderWithIntl(<CostResources name="cost-resources" />);

    const input = screen.getByPlaceholderText('Loading...');
    expect(input).toBeInTheDocument();
    expect(input.closest('.pf-v6-c-menu-toggle')).toHaveClass('pf-m-disabled');
  });

  it('shows no resources available when query finishes with empty options', () => {
    vi.mocked(useResourceTypesQuery).mockReturnValue({
      data: { data: [{ value: 'aws.cost', path: '/api/cost-management/v1/resources/aws-cost/' }] },
      isLoading: false,
    } as unknown as ReturnType<typeof useResourceTypesQuery>);

    vi.mocked(useQueries).mockReturnValue([
      {
        data: { data: [] },
        isLoading: false,
      },
    ] as unknown as ReturnType<typeof useQueries>);

    renderWithIntl(<CostResources name="cost-resources" />);

    const input = screen.getByPlaceholderText('No resources available (applies to all)');
    expect(input).toBeInTheDocument();
    expect(input.closest('.pf-v6-c-menu-toggle')).toHaveClass('pf-m-disabled');
  });

  it('keeps selector enabled when searching with no matching filter results', () => {
    vi.mocked(useResourceTypesQuery).mockReturnValue({
      data: { data: [{ value: 'aws.cost', path: '/api/cost-management/v1/resources/aws-cost/' }] },
      isLoading: false,
    } as unknown as ReturnType<typeof useResourceTypesQuery>);

    vi.mocked(useQueries).mockReturnValue([
      {
        data: { data: [{ value: 'Resource-1' }, { value: 'Resource-2' }] },
        isLoading: false,
      },
    ] as unknown as ReturnType<typeof useQueries>);

    renderWithIntl(<CostResources name="cost-resources" />);

    const input = screen.getByPlaceholderText('Select resources (optional - default all)');
    expect(input).toBeInTheDocument();
    expect(input.closest('.pf-v6-c-menu-toggle')).not.toHaveClass('pf-m-disabled');

    // Click to open dropdown
    const toggleButton = screen.getByRole('button', { name: 'Menu toggle' });
    fireEvent.click(toggleButton);

    // Type a search query that does not match any resource
    fireEvent.change(input, { target: { value: 'nonexistent' } });

    // The selector should NOT be disabled and placeholder must remain the optional placeholder
    expect(input).toHaveValue('nonexistent');
    expect(input.closest('.pf-v6-c-menu-toggle')).not.toHaveClass('pf-m-disabled');
    expect(input).toHaveAttribute('placeholder', 'Select resources (optional - default all)');

    // Dropdown should display 'No results found'
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });
});
