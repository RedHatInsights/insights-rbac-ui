import React, { Fragment } from 'react';
import { DateFormat } from '@redhat-cloud-services/frontend-components';
import { Link } from 'react-router-dom';
import { Button } from '@patternfly/react-core';

export const createRows = (data) => (
  data.reduce((acc, { uuid, name, description, system, policyCount, modified }) => ([
    ...acc,
    {
      uuid,
      system,
      cells: [
        <Fragment key={ `${uuid}-name` }>
          <Link to={ `/roles/detail/${uuid}` }>
            <Button variant="link"> { name } </Button>
          </Link>
        </Fragment>,
        description,
        policyCount,
        <Fragment key={ `${uuid}-modified` }>
          <DateFormat date={ modified } type="relative" />
        </Fragment>
      ]
    }
  ]), [])
);
