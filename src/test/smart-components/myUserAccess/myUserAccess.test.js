import React from 'react';
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import MyUserAccess from '../../../smart-components/myUserAccess/myUserAccess';

describe('<MyUserAccess />', () => {
  it('should render correctly', () => {
    expect(toJson(mount(
        <MyUserAccess/>
    ))).toMatchSnapshot();
  });
});
