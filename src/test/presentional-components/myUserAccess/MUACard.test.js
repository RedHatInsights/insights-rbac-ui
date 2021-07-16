import React from 'react';
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import MUACard from '../../../presentational-components/myUserAccess/MUACard';
import { MemoryRouter } from 'react-router-dom';
import { Card } from '@patternfly/react-core';
/**
 * Mock bundle data
 */
jest.mock('../../../presentational-components/myUserAccess/bundles');

const RouterWrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>;
const entitlementsMock = [
  ['entitled', { is_entitled: true, is_trial: false }],
  ['not-entitled', { is_entitled: false, is_trial: false }],
];
describe('<MUACard />', () => {
  it('should render correctly', () => {
    expect(
      toJson(
        mount(
          <RouterWrapper>
            <MUACard header="Test" entitlements={entitlementsMock} />
          </RouterWrapper>
        ).find(MUACard)
      )
    ).toMatchSnapshot();
  });

  it('should render correctly disabled', () => {
    expect(
      toJson(
        mount(
          <RouterWrapper>
            <MUACard header="Test" isDisabled entitlements={entitlementsMock} />
          </RouterWrapper>
        ).find(MUACard)
      )
    ).toMatchSnapshot();
  });

  it('should not render a MUACard if not listed in entitlemends', () => {
    const wrapper = mount(
      <RouterWrapper>
        <MUACard header="Test" isDisabled entitlements={[]} />
      </RouterWrapper>
    );
    expect(wrapper.find(Card)).toHaveLength(0);
  });
});
