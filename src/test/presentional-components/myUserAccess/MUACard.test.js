import React from 'react';
import MUACard from '../../../presentational-components/myUserAccess/MUACard';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
/**
 * Mock bundle data
 */
jest.mock('../../../presentational-components/myUserAccess/bundles');

const RouterWrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>;
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
      </RouterWrapper>
    );

    expect(container.firstChild).toMatchSnapshot();
    expect(screen.getByText(mockHeader)).toBeInTheDocument();
  });

  test('Should render, but being disabled', () => {
    const { container } = render(
      <RouterWrapper>
        <MUACard header={mockHeader} entitlements={entitlementsMock} isDisabled />
      </RouterWrapper>
    );

    expect(container.firstChild).toMatchSnapshot();

    const cardLinks = screen.getAllByLabelText('card-link');
    expect(cardLinks[0]).toHaveClass('rbac-c-mua-bundles__cardlink rbac-c-mua-bundles__cardlink--disabled');
  });

  test('Should not render when unentitled', () => {
    const { container } = render(
      <RouterWrapper>
        <MUACard header={mockHeader} entitlements={[]} />
      </RouterWrapper>
    );

    expect(container.firstChild).toMatchSnapshot();

    const cardLinks = screen.queryAllByRole('link', { name: /cardlink/i });
    expect(cardLinks).toHaveLength(0);
  });
});
