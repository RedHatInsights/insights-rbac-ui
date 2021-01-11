import React from 'react';
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import GroupInformation from '../../../../smart-components/group/add-group/group-information';

describe('<GroupInformation />', () => {
  let initialProps;

  beforeEach(() => {
    initialProps = {
      formValue: {
        name: 'Foo',
        description: 'This is a test'
      },
      onHandleChange: jest.fn(),
      setIsGroupInfoValid: jest.fn()
    };
  });

  it('should render correctly', () => {
    const wrapper = mount(<GroupInformation { ...initialProps } />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });
});
