import React from 'react';
import { mount } from 'enzyme';
import ResourceDefinitionsButton from '../../../presentational-components/myUserAccess/ResourceDefinitionsButton';
import { Button } from '@patternfly/react-core';

describe('<ResourceDefinitionsButton />', () => {
  it('should render enabled and show RD length', () => {
    const wrapper = mount(<ResourceDefinitionsButton onClick={jest.fn()} access={{ resourceDefinitions: [1] }} />);
    expect(wrapper.find(Button).prop('isDisabled')).toEqual(false);
    expect(wrapper.find('button').text()).toEqual('1');
  });

  it('should render disabled and show RD length NA', () => {
    const wrapper = mount(<ResourceDefinitionsButton onClick={jest.fn()} access={{ resourceDefinitions: [] }} />);
    expect(wrapper.find(Button).prop('isDisabled')).toEqual(true);
    expect(wrapper.find('button').text()).toEqual('N/A');
  });
});
