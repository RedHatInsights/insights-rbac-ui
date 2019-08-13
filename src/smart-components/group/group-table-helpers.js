import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@patternfly/react-core';
import ExpandableDescription from './expandable-description';

export const createRows = (data, filterValue = undefined) => {
  console.log('Debug Group list createRows - data', data);
  return data.filter(item => { const filter = filterValue ? item.name.includes(filterValue) : true;
    return filter; }).reduce((acc,  { uuid, name, description, members }, key) => ([
    ...acc, {
      uuid,
      isOpen: false,
      cells: [ <Fragment key={ uuid }><Link to={ `/groups/detail/${uuid}` }>
        <Button variant="link"> { name } </Button></Link></Fragment>, description, members.length ]
    }, {
      parent: key * 2,
      fullWidth: true,
      cells: [{ title: <ExpandableDescription description={ description } members={ members } /> }]
    }
  ]), []);
};

