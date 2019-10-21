import React from 'react';
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import SummaryContent from '../../../../smart-components/group/add-group/summary-content';

describe('<SummaryContent />', () => {
  let initialProps;

  beforeEach(() => {
    initialProps = {
      formData: {
        values: {
          name: 'TestGroupName',
          description: 'This is a test',
          policy: {
            name: 'TestPolicyName',
            description: 'Test Policy Description'
          }
        },
        selectedUsers: [],
        selectedRoles: []
      }
    };
  });

  it('should render correctly', () => {
    const wrapper = mount(<SummaryContent{ ...initialProps } />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });
});

