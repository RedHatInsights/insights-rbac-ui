import React from 'react';
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import MUACard from '../../../presentational-components/myUserAccess/MUACard';
import entitlementsMock from '../../../../config/setupTests';

describe('<MUACard />', () => {
  it('should render correctly', () => {
    expect(toJson(mount(
        <MUACard
            header='Test'
            entitlements={ entitlementsMock }/>
    ))).toMatchSnapshot();
  });

  it('should render correctly disabled', () => {
    expect(toJson(mount(
        <MUACard
            header='Test'
            isDisabled
            entitlements={ entitlementsMock }/>
    ))).toMatchSnapshot();
  });
});
