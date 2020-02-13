import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { DateFormat } from '@redhat-cloud-services/frontend-components';

export const createRows = (data, opened, selectedRows = []) => (
  data.reduce((acc, { uuid, name, description, principalCount, modified }) => ([
    ...acc,
    {
      uuid,
      cells: [
        <Fragment key={ uuid }>
          <Link to={ `/groups/detail/${uuid}` }>
            { name }
          </Link>
        </Fragment>,
        description,
        principalCount,
        <Fragment key={ `${uuid}-modified` }>
          <DateFormat date={ modified } type="relative" />
        </Fragment>
      ],
      selected: Boolean(selectedRows && selectedRows.find(row => row.uuid === uuid))
    }
  ]), [])
);

