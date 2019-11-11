import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@patternfly/react-core';
import ExpandableDescription from './expandable-description';
import { DateFormat } from '@redhat-cloud-services/frontend-components';

export const createRows = (data, opened) => (
  data.reduce((acc, { uuid, name, description, principalCount, modified }, key) => ([
    ...acc,
    {
      uuid,
      isOpen: Boolean(opened[uuid]),
      cells: [
        <Fragment key={ uuid }>
          <Link to={ `/groups/detail/${uuid}` }>
            <Button variant="link"> { name } </Button>
          </Link>
        </Fragment>,
        description,
        principalCount,
        <Fragment key={ `${uuid}-modified` }>
          <DateFormat date={ modified } type="relative" />
        </Fragment>
      ]
    }, {
      parent: key * 2,
      fullWidth: true,
      cells: [{
        title: opened[uuid] ?
          <ExpandableDescription uuid={ uuid } /> :
          <Fragment />
      }]
    }
  ]), [])
);

