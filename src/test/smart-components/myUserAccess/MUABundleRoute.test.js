import React from 'react';
import { act } from 'react-dom/test-utils';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MuaBundleRoute from '../../../features/myUserAccess/MUABundleRoute';
import PropTypes from 'prop-types';

jest.mock('../../../features/myUserAccess/bundles/rhel');

const ComponentWrapper = ({ children, initialEntries }) => <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>;

ComponentWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  initialEntries: PropTypes.arrayOf(PropTypes.string).isRequired,
};

describe('<MUABundleRoute />', () => {
  it('should render placeholder component when no bundle is found', () => {
    /**
     * This action will log an error to console, that is expected
     */
    const { container } = render(
      <ComponentWrapper initialEntries={['/foo?bundle=nonsense']}>
        <MuaBundleRoute />
      </ComponentWrapper>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render rhel bundle mock', async () => {
    let container;
    await act(async () => {
      const { container: ci } = render(
        <ComponentWrapper initialEntries={['/foo?bundle=rhel']}>
          <MuaBundleRoute />
        </ComponentWrapper>,
      );
      container = ci;
    });

    expect(container.querySelector('div#rhel-mock')).toBeInTheDocument();
  });
});
