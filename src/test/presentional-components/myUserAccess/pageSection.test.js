import React from 'react';
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import MUAPageSection from '../../../presentational-components/myUserAccess/pageSection';

describe('<MUAPageSection />', () => {
  it('should render correctly', () => {
    expect(toJson(mount(
        <MUAPageSection
            title='test title'
            description='test description'>
            <span> test children </span>
        </MUAPageSection>
    ))).toMatchSnapshot();
  });
});
