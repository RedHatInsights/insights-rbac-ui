import React from 'react';
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import PolicyInformation from '../../../../smart-components/group/add-group/policy-information';

describe('<PolicyInformation />', () => {
  let initialProps;

  beforeEach(() => {
    initialProps = {
      title: 'Policy info title',
      editType: 'add',
      formData: {
        policy: {
          name: 'Test policy name',
          description: 'Test policy description'
        }
      },
      onHandleChange: jest.fn(),
      setIsPolicyInfoValid: jest.fn()
    };
  });

  it('should render correctly', () => {
    const wrapper = mount(<PolicyInformation { ...initialProps } />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });
});
