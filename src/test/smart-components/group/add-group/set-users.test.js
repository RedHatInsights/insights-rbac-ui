import React from 'react';
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import SetUsers from '../../../../smart-components/group/add-group/set-users';

describe('<SetUsers />', () => {
  let initialProps;

  beforeEach(() => {
    initialProps = {
      setGroupData: jest.fn(),
      selectedUsers: [],
      setSelectedUsers: jest.fn(),
      optionIdx: 0,
      setOptionIdx: jest.fn(),
      createOption: jest.fn()
    };
  });

  it('should render correctly', () => {
    const wrapper = mount(<SetUsers{ ...initialProps } />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });
});

