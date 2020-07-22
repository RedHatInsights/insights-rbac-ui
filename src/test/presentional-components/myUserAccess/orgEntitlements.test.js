import React from 'react';
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import MUAOrgEntitlements from '../../../presentational-components/myUserAccess/orgEntitlements';
import { entitlementsMock } from '../../../../config/setupTests';

describe('<MUAOrgEntitlements />', () => {
  it('should render correctly', () => {
    expect(toJson(mount(
        <MUAOrgEntitlements entitlements={ entitlementsMock }/>
    ))).toMatchSnapshot();
  });
});
