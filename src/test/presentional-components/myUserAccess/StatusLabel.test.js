import React from 'react';
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import StatusLabel from '../../../presentational-components/myUserAccess/StatusLabel';

describe('<StatusLabel />', () => {
  it('should render correctly', () => {
    expect(toJson(mount(<StatusLabel />))).toMatchSnapshot();
  });

  it('should render correctly as admin', () => {
    expect(toJson(mount(<StatusLabel isOrgAdmin />))).toMatchSnapshot();
  });
});
