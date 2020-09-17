import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import ActiveUsers from '../../../presentational-components/shared/ActiveUsers';

describe('<ActiveUsers />', () => {
  it('should render correctly', () => {
    expect(toJson(shallow(<ActiveUsers />))).toMatchSnapshot();
  });

  it('should render correctly with description', () => {
    expect(toJson(shallow(<ActiveUsers description="some description" />))).toMatchSnapshot();
  });

  it('should render correctly with link title', () => {
    expect(toJson(shallow(<ActiveUsers linkTitle="some title" />))).toMatchSnapshot();
  });
});
