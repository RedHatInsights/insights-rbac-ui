import React from 'react';
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import OrgAdminLabel from '../../../presentational-components/myUserAccess/orgAdminLabel';

describe('<OrgAdminLabel />', () => {
  it('should render correctly', () => {
    expect(toJson(mount(
        <OrgAdminLabel/>
    ))).toMatchSnapshot();
  });
});
