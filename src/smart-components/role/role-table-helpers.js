import React, { Fragment } from 'react';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';
import { Link } from 'react-router-dom';
import { getDateFormat } from '../../helpers/shared/helpers';

export const createRows = (data) =>
  data.reduce(
    (acc, { uuid, display_name, name, description, system, accessCount, groups_in_count: groupsCount, modified }) => [
      ...acc,
      {
        uuid,
        system,
        cells: [
          <Fragment key={`${uuid}-name`}>
            <Link to={`detail/${uuid}`}>{display_name || name}</Link>
          </Fragment>,
          description,
          <Fragment key={`${uuid}-accessCount`}>
            <Link to={`detail/${uuid}`}>{accessCount}</Link>
          </Fragment>,
          groupsCount,
          <Fragment key={`${uuid}-modified`}>
            <DateFormat date={modified} type={getDateFormat(modified)} />
          </Fragment>,
        ],
      },
    ],
    []
  );
