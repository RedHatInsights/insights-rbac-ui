import React from 'react';
import { Label } from '@patternfly/react-core';
import classNames from 'classnames';

export const createRows = (data, _opened, checkedRows = []) => {
  return (
    data.reduce((acc,  { is_active: isActive, username, email, first_name: firstName, last_name: lastName }) => ([
      ...acc,
      {
        uuid: username,
        username,
        cells: [{
          title: (
            <Label isCompact color={ isActive && 'green' } className={ classNames('ins-c-rbac__user-label', { 'ins-m-inactive': !isActive }) }>
              {isActive ? 'Active' : 'Inactive'}
            </Label>
        ),
        props: {
          data: { isActive }
        }
      }, username, email, lastName, firstName ],
        selected: checkedRows.find(row => row.uuid === username)
      }
    ]), []));
};

