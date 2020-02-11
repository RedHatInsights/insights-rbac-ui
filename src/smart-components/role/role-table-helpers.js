import React, { Fragment } from 'react';
import { DateFormat } from '@redhat-cloud-services/frontend-components';
import { Link } from 'react-router-dom';
import { Button } from '@patternfly/react-core';

export const createRows = (data) => (
  data.reduce((acc, { uuid, name, description, system, accessCount, modified }) => ([
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
        <Fragment key={ `${uuid}-accessCount` }>
          <Link to={ `/roles/detail/${uuid}` }>
            <Button variant="link"> { accessCount } </Button>
          </Link>
        </Fragment>,
        <Fragment key={ `${uuid}-modified` }>
          <DateFormat date={ modified } type="relative" />
        </Fragment>
      ]
    }
  ]), [])
);
