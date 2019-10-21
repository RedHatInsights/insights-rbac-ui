import React from 'react';
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import PolicySetRoles from '../../../../smart-components/group/add-group/policy-set-roles';

describe('<PolicySetRoles />', () => {
  let initialProps;

  beforeEach(() => {
    initialProps = {
      selectedRoles: [],
      setSelectedRoles: jest.fn(),
      roles: [],
      title: 'Test set roles',
      description: 'Test for set roles page'
    };
  });

  it('should render correctly', () => {
    const wrapper = mount(<PolicySetRoles { ...initialProps } />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });
});
