import React from 'react';
import { act } from 'react-dom/test-utils';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import MUAContent from '../../../smart-components/myUserAccess/MUAContent';
jest.mock('../../../smart-components/myUserAccess/bundles/rhel');

const ComponentWrapper = ({ initialEntries, children }) => <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>;

describe('<MUAContent />', () => {
  it('should render one entitled', async () => {
    const entitlements = {
      entitled: {
        is_entitled: true,
      },
    };

    await act(async () => {
      render(
        <ComponentWrapper initialEntries={['/foo?bundle=rhel']}>
          <MUAContent entitlements={entitlements} isOrgAdmin />
        </ComponentWrapper>
      );
    });

    expect(screen.getByTestId('entitle-section')).toBeInTheDocument();
  });
  it('should render permissions title for non org admins', async () => {
    const entitlements = {};

    await act(async () => {
      render(
        <ComponentWrapper initialEntries={['/foo?bundle=rhel']}>
          <MUAContent entitlements={entitlements} isOrgAdmin={false} />
        </ComponentWrapper>
      );
    });

    expect(screen.getByText('Your {name} permissions')).toBeInTheDocument();
  });
});
