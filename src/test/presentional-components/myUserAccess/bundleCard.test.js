import React from 'react';
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import MUABundleCard from '../../../presentational-components/myUserAccess/bundleCard';

describe('<MUABundleCard />', () => {
  it('should render correctly', () => {
    expect(toJson(mount(
        <MUABundleCard
            entitlement='entitlement'
            title='title'
            body='body'
            url='url'
            appList={ { appName: '/' } }/>
    ))).toMatchSnapshot();
  });
});
