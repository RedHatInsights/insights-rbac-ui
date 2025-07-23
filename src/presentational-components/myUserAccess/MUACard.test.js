import React from 'react';
import MUACard from './MUACard';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import PropTypes from 'prop-types';

/**
 * Mock bundle data
 */
jest.mock('./bundles.ts', () => ({
  bundleData: [
    {
      entitlement: 'entitled',
      title: 'Entitled',
      apps: {
        eApp1: '/eapp1',
        eApp2: '/eapp2',
      },
      appsIds: ['a1', 'a2'],
    },
    {
      entitlement: 'not-entitled',
      title: 'Not entitled',
      apps: {
        neApp1: '/neapp1',
        neApp2: '/neapp2',
      },
      appsIds: ['na1', 'na2'],
    },
  ],
}));

const RouterWrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>;
RouterWrapper.propTypes = {
  children: PropTypes.node.isRequired,
};
const entitlementsMock = [
  ['entitled', { is_entitled: true, is_trial: false }],
  ['not-entitled', { is_entitled: false, is_trial: false }],
];
const mockHeader = 'TestHeader';

describe('<MUACard />', () => {
  test('Should render correctly if entitled', () => {
    const { container } = render(
      <RouterWrapper>
        <MUACard header={mockHeader} entitlements={entitlementsMock} />
      </RouterWrapper>,
    );

    expect(container.firstChild).toMatchSnapshot();
    expect(screen.getByText(mockHeader)).toBeInTheDocument();
  });

  test('Should render, but being disabled', () => {
    const { container } = render(
      <RouterWrapper>
        <MUACard header={mockHeader} entitlements={entitlementsMock} isDisabled />
      </RouterWrapper>,
    );

    expect(container.firstChild).toMatchSnapshot();

    // The component should render the "entitled" card when isDisabled is true
    const cardLinks = screen.getAllByLabelText('card-link');
    expect(cardLinks[0]).toHaveClass('rbac-c-mua-bundles__cardlink pf-v5-u-background-color-disabled-color-300');
  });

  test('Should not render when unentitled', () => {
    const { container } = render(
      <RouterWrapper>
        <MUACard header={mockHeader} entitlements={[]} />
      </RouterWrapper>,
    );

    expect(container.firstChild).toMatchSnapshot();

    const cardLinks = screen.queryAllByRole('link', { name: /cardlink/i });
    expect(cardLinks).toHaveLength(0);
  });
});
