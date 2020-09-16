import React from 'react';
import { act } from 'react-dom/test-utils';
import { Modal } from '@patternfly/react-core';
import { RowWrapper, Table } from '@patternfly/react-table';
import ResourceDefinitionsModal from '../../../smart-components/myUserAccess/ResourceDefinitionsModal';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';

describe('<ResourceDefinitionsModal />', () => {
  const initialProps = {
    isOpen: true,
    handleClose: jest.fn(),
    permission: 'foo:bar:baz',
    resourceDefinitions: [
      {
        attributeFilter: {
          value: 'first-rd',
        },
      },
      {
        attributeFilter: {
          value: 'second-rd',
        },
      },
    ],
  };

  it('should render a modal with table and two rows', () => {
    const wrapper = mount(<ResourceDefinitionsModal {...initialProps} />);
    expect(wrapper.find(Modal)).toHaveLength(1);
    expect(wrapper.find(Table)).toHaveLength(1);
    expect(wrapper.find(RowWrapper)).toHaveLength(2);
  });

  it('should filter rows by resource definition', () => {
    const wrapper = mount(<ResourceDefinitionsModal {...initialProps} />);
    const input = wrapper.find('input').first();
    input.getDOMNode().value = 'first';
    input.simulate('change');
    wrapper.update();
    expect(wrapper.find(RowWrapper)).toHaveLength(1);
    expect(wrapper.find('td').text()).toEqual('first-rd');
  });

  it('should change pagination configuration', () => {
    const wrapper = mount(<ResourceDefinitionsModal {...initialProps} />);
    expect(wrapper.find(TableToolbarView).prop('pagination')).toEqual(expect.objectContaining({ limit: 20 }));
    wrapper.find('DropdownToggle').first().find('button').first().simulate('click');
    wrapper.update();

    act(() => {
      wrapper.find('InternalDropdownItem').last().prop('onClick')();
    });
    wrapper.update();
    expect(wrapper.find(TableToolbarView).prop('pagination')).toEqual(expect.objectContaining({ limit: 50 }));
  });
});
