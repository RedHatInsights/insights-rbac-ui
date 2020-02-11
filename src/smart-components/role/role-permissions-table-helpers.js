import React, { Fragment } from 'react';
import { DateFormat } from '@redhat-cloud-services/frontend-components';

export const createRows = (data) => (
  data.reduce((acc, { permission, modified }) => {
    const [ appName, type, operation ] = permission.split(':');
    return ([
      ...acc,
      {
        cells: [
          appName,
          type,
          operation,
          <Fragment key={ `${appName}-modified` }>
            <DateFormat date={ modified } type="relative" />
          </Fragment>
        ]
      }
    ]);
  }, [])
);
