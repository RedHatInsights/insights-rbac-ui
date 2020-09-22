import React, { Fragment } from 'react';
import { mount } from 'enzyme';
import { createRows } from '../../../smart-components/myUserAccess/mua-table-helpers';
import { Button } from '@patternfly/react-core';

describe('Mua table helpers', () => {
  describe('createRows', () => {
    const data = [
      {
        permission: 'foo:bar:baz',
        otherAttributes: true,
        resourceDefinitions: [],
      },
      {
        permission: 'quazz:quxx:*',
        otherAttributes: true,
        resourceDefinitions: [],
      },
    ];

    it('should create rows definition witouth resourceDefinitions column', () => {
      const expectedResult = [
        {
          cells: ['foo', 'bar', 'baz'],
        },
        {
          cells: ['quazz', 'quxx', '*'],
        },
      ];
      const rows = createRows(data);
      expect(rows).toEqual(expectedResult);
    });

    it('should create rows definition with resourceDefinitions column', () => {
      const clickSpy = jest.fn();
      const expectedResult = [
        {
          cells: ['foo', 'bar', 'baz', expect.any(Object)],
        },
        {
          cells: ['quazz', 'quxx', '*', expect.any(Object)],
        },
      ];
      const rows = createRows(data, true, clickSpy);
      expect(rows).toEqual(expectedResult);
      const child = rows[0].cells[3];
      const component = mount(<Fragment>{child}</Fragment>);
      expect(component.find(Button)).toHaveLength(1);
      component.find(Button).prop('onClick')();
      expect(clickSpy).toHaveBeenCalledWith(0);
    });
  });
});
