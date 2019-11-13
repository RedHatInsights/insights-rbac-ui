import React, { Fragment } from 'react';
import { DateFormat } from '@redhat-cloud-services/frontend-components';

export const createRows = (data) => (
  data.reduce((acc, { uuid, name, description, system, policyCount, modified }) => ([
    ...acc,
    {
      uuid,
      system,
      cells: [
        name,
        description,
        policyCount,
        <Fragment key={ `${uuid}-modified` }>
          <DateFormat date={ modified } type="relative" />
        </Fragment>
      ]
    }
  ]), [])
);
