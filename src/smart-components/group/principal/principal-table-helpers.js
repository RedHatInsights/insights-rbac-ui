import React from 'react';
import { Label } from '@patternfly/react-core';

export const createRows = (data, _opened, checkedRows = []) => {
  return data.reduce(
    (acc, { is_active: isActive, username, email, first_name: firstName, last_name: lastName }) => [
      ...acc,
      {
        uuid: username,
        username,
        cells: [
          {
            title: <Label color={isActive && 'green'}>{isActive ? 'Active' : 'Inactive'}</Label>,
            props: {
              data: { isActive },
            },
          },
          username,
          email,
          lastName,
          firstName,
        ],
        selected: checkedRows.find((row) => row.uuid === username),
      },
    ],
    []
  );
};
