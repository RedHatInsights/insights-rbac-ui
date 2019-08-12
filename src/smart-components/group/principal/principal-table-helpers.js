import React from 'react';
import ExpandableContent from './expandable-content';

export const createRows = (data, filterValue = undefined) => {
  console.log('Debug - data', data);
  return data.filter(item => { const filter = filterValue ? item.name.includes(filterValue) : true;
    return filter; }).reduce((acc,  { uuid, name, email }, key) => ([
    ...acc, {
      uuid,
      isOpen: false,
      cells: [ name, email ]
    }, {
      parent: key * 2,
      fullWidth: true,
      cells: [{ title: <ExpandableContent description={ name } email={ email } /> }]
    }
  ]), []);
};

