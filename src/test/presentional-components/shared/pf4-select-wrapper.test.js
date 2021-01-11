import React from 'react';
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import { FormSelectOption } from '@patternfly/react-core';
import Pf4SelectWrapper from '../../../presentational-components/shared/pf4-select-wrapper';

describe('<Pf4SelectWrapper />', () => {
  let initialProps;
  beforeEach(() => {
    initialProps = {
      id: 'bazz',
      input: {
        name: 'bazz',
        value: '',
        onChange: jest.fn()
      },
      meta: {},
      options: [{
        label: 'Foo',
        value: 'bar'
      }],
      FieldProvider: () => <div />
    };
  });

  it('should render correctly', () => {
    const wrapper = mount(<Pf4SelectWrapper { ...initialProps } />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  it('should create empty option', () => {
    const wrapper = mount(<Pf4SelectWrapper { ...initialProps } />);
    const options = wrapper.find('option');
    expect(options).toHaveLength(2);
  });

  it('should create empty option for required field', () => {
    const wrapper = mount(<Pf4SelectWrapper isRequired { ...initialProps } />);
    const options = wrapper.find(FormSelectOption);
    expect(options).toHaveLength(2);
    expect(options.first().props().label).toEqual('Please choose');
  });

  it('should not create empty option', () => {
    const wrapper = mount(<Pf4SelectWrapper { ...initialProps } options={ [{ label: 'Foo', value: 'bar' }, { label: 'Empty value' }] } />);
    const options = wrapper.find('option');
    expect(options).toHaveLength(2);
  });

  it('should not create empty option if select has value and is required', () => {
    const wrapper = mount(
      <Pf4SelectWrapper
        isRequired { ...initialProps }
        input={ { ...initialProps.input, value: 'some value' } }
        options={ [{ label: 'Foo', value: 'bar' }] }
      />);
    const options = wrapper.find('option');
    expect(options).toHaveLength(1);
  });

  it('should render correctly in error state', () => {
    const wrapper = mount(<Pf4SelectWrapper { ...initialProps } meta={ { error: 'Error', touched: true } } />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  it('should render correctly with description', () => {
    const wrapper = mount(<Pf4SelectWrapper { ...initialProps } description="description" />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  it('should call onChange function', () => {
    const onChange = jest.fn();
    const wrapper = mount(<Pf4SelectWrapper { ...initialProps } input={ { ...initialProps.input, onChange } } />);
    wrapper.find('select').simulate('change', { target: { value: 'Foo' }});
    expect(onChange).toHaveBeenCalledWith('', expect.objectContaining({ target: { value: 'Foo' }}));
  });
});
