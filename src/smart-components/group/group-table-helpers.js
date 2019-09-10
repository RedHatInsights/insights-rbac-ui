import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@patternfly/react-core';
import ExpandableDescription from './expandable-description';
import { timeAgo } from '../../helpers/shared/helpers';

export const createRows = (data, filterValue = undefined) => (
  data.filter(item => { const filter = filterValue ? item.name.includes(filterValue) : true;
    return filter; }).reduce((acc,  { uuid, name, description, members, modified }, key) => ([
    ...acc, { uuid,
      isOpen: false,
      cells: [ <Fragment key={ uuid }><Link to={ `/groups/detail/${uuid}` }>
        <Button variant="link"> { name } </Button></Link></Fragment>, description, members.length, `${timeAgo(modified)}` ]
    }, {
      parent: key * 2,
      fullWidth: true,
      cells: [{ title: <ExpandableDescription description={ description } members={ members } /> }]
    }
  ]), [])
);

