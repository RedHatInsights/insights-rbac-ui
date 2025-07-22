import React from 'react';
import { Label } from '@patternfly/react-core';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

export const createRows = (data, checkedRows = []) => {
  const intl = useIntl();
  return data.reduce(
    (acc, { is_active: isActive, username, email, first_name: firstName, last_name: lastName }) => [
      ...acc,
      {
        uuid: username,
        username,
        cells: [
          {
            title: <Label color={isActive && 'green'}>{intl.formatMessage(isActive ? messages.active : messages.inactive)}</Label>,
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
    [],
  );
};
