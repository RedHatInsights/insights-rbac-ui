import React from 'react';
import ExpandableContent from './expandable-content';

export const createRows = (data, filterValue = undefined) =>(
  data.filter(item => { const filter = filterValue ? item.username.includes(filterValue) : true;
    return filter; }).reduce((acc,  { uuid, username, email, first_name, last_name }, key) => ([
    ...acc, { uuid,
      isOpen: false,
      cells: [ username, email, first_name, last_name ]
    }, {
      parent: key * 2,
      fullWidth: true,
      cells: [{ title: <ExpandableContent name={ username }
        email={ email }
        first_name={ first_name }
        last_name={ last_name }/> }]
    }
  ]), []));

