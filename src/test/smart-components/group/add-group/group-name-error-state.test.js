import React from 'react';
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import GroupNameErrorState from '../../../../smart-components/group/add-group/group-name-error-state';

describe('<GroupNameErrorState />', () => {
  let initialProps;

  beforeEach(() => {
    initialProps = {
      setHideFooter: () => undefined,
    };
  });

  it('should render correctly', () => {
    const wrapper = mount(<GroupNameErrorState {...initialProps} />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });
});
