import React, { Fragment } from 'react';
import { fireEvent, render } from '@testing-library/react';
import { createRows } from '../../../features/myUserAccess/mua-table-helpers';

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
      ];
      const rows = createRows(
        [
          {
            permission: 'foo:bar:baz',
            otherAttributes: true,
            resourceDefinitions: [1],
          },
        ],
        true,
        clickSpy,
      );
      expect(rows).toEqual(expectedResult);
      const child = rows[0].cells[3];
      const { container } = render(<Fragment>{child}</Fragment>);
      expect(container.querySelectorAll('a')).toHaveLength(1);
      fireEvent.click(container.querySelector('a'));
      expect(clickSpy).toHaveBeenCalledWith(0);
    });
  });
});
