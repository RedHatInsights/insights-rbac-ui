import React from 'react';
import { act } from 'react-dom/test-utils';
import { mount } from 'enzyme';
import { MemoryRouter } from 'react-router-dom';
import MuaBundleRoute from '../../../smart-components/myUserAccess/MUABundleRoute';

jest.mock('../../../smart-components/myUserAccess/bundles/insights');

const ComponentWrapper = ({ children, initialEntries }) => <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>;
describe('<MUABundleRoute />', () => {
  it('should render placeholder component when no bundle is found', () => {
    /**
     * This action will log an error to console, that is expected
     */
    const wrapper = mount(
      <ComponentWrapper initialEntries={['/foo?bundle=nonsense']}>
        <MuaBundleRoute />
      </ComponentWrapper>
    );

    expect(wrapper.find('Placeholder')).toHaveLength(1);
  });

  it('should render insights bundle mock', async () => {
    let wrapper;

    await act(async () => {
      wrapper = mount(
        <ComponentWrapper initialEntries={['/foo?bundle=insights']}>
          <MuaBundleRoute />
        </ComponentWrapper>
      );
    });
    wrapper.update();

    expect(wrapper.find('div#insights-mock')).toHaveLength(1);
  });
});
