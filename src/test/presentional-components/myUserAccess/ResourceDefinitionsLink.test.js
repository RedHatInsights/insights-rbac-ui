import React from 'react';
import { mount } from 'enzyme';
import ResourceDefinitionsLink from '../../../presentational-components/myUserAccess/ResourceDefinitionsLink';

describe('<ResourceDefinitionsLink />', () => {
  it('should render enabled and show RD length', () => {
    const wrapper = mount(<ResourceDefinitionsLink onClick={jest.fn()} access={{ resourceDefinitions: [1] }} />);
    expect(wrapper.find('a').text()).toEqual('1');
  });

  it('should render disabled and show RD length NA', () => {
    const wrapper = mount(<ResourceDefinitionsLink onClick={jest.fn()} access={{ resourceDefinitions: [] }} />);
    expect(wrapper.find('span').text()).toEqual('N/A');
  });
});
