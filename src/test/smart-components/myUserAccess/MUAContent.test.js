import React from 'react';
import { act } from 'react-dom/test-utils';
import { mount } from 'enzyme';
import { MemoryRouter } from 'react-router-dom';
import { Title } from '@patternfly/react-core';

import MUAContent from '../../../smart-components/myUserAccess/MUAContent';
jest.mock('../../../smart-components/myUserAccess/bundles/insights');

const ComponentWrapper = ({ initialEntries, children }) => <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>;

describe('<MUAContent />', () => {
  it('should render one entitled and un_entitled sections', async () => {
    const entitlements = {
      entitled: {
        is_entitled: true,
      },
      unEntitled: {
        is_entitled: false,
      },
    };

    let wrapper;

    await act(async () => {
      wrapper = mount(
        <ComponentWrapper initialEntries={['/foo?bundle=insights']}>
          <MUAContent entitlements={entitlements} isOrgAdmin />
        </ComponentWrapper>
      );
    });

    expect(wrapper.find('div.pf-l-stack__item.ins-l-myUserAccess-section__cards--entitled')).toHaveLength(1);
    expect(wrapper.find('div.pf-l-stack__item.ins-l-myUserAccess-section__cards--unentitled')).toHaveLength(1);
  });
  it('should render permissions title for non org admins', async () => {
    const entitlements = {};
    let wrapper;

    await act(async () => {
      wrapper = mount(
        <ComponentWrapper initialEntries={['/foo?bundle=insights']}>
          <MUAContent entitlements={entitlements} isOrgAdmin={false} />
        </ComponentWrapper>
      );
    });

    expect(wrapper.find(Title).last().text()).toEqual('Your permissions');
  });
});
