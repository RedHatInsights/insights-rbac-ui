import React from 'react';
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import FilterToolbarItem from '../../../presentational-components/shared/filter-toolbar-item';

describe('<FilterToolbarItem />', () => {
  let intialProps;
  beforeEach(() => {
    intialProps = {
      onFilterChange: jest.fn(),
      placeholder: 'Foo'
    };
  });

  it('should render correctly', () => {
    const wrapper = mount(<FilterToolbarItem { ...intialProps } />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  it('should call filter change callback', () => {
    const onFilterChange = jest.fn();
    const wrapper = mount(<FilterToolbarItem { ...intialProps } searchValue="bar" onFilterChange={ onFilterChange } />);
    wrapper.find('input').simulate('change');
    expect(onFilterChange).toHaveBeenCalledWith('bar', expect.any(Object));
    expect(onFilterChange).toHaveBeenCalledTimes(1);

    wrapper.find('button').simulate('click');
    expect(onFilterChange).toHaveBeenCalledWith('bar', expect.any(Object));
    expect(onFilterChange).toHaveBeenCalledTimes(2);
  });
});
