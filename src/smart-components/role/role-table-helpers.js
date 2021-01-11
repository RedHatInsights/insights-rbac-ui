import React, { Fragment } from 'react';
import { DateFormat } from '@redhat-cloud-services/frontend-components';
import { Link } from 'react-router-dom';

export const createRows = (data) =>
  data.reduce(
    (acc, { uuid, display_name, name, description, system, accessCount, groups_in_count: groupsCount, modified }) => [
      ...acc,
      {
        uuid,
        system,
        cells: [
          <Fragment key={`${uuid}-name`}>
            <Link to={`/roles/detail/${uuid}`}>{display_name || name}</Link>
          </Fragment>,
          description,
          <Fragment key={`${uuid}-accessCount`}>
            <Link to={`/roles/detail/${uuid}`}>{accessCount}</Link>
          </Fragment>,
          groupsCount,
          <Fragment key={`${uuid}-modified`}>
            <DateFormat date={modified} type="relative" />
          </Fragment>,
        ],
      },
    ],
    []
  );
