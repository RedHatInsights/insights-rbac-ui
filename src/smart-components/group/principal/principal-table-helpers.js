import React from 'react';
import ExpandableContent from './expandable-content';

export const createRows = (data, opened = [], checkedRows = []) => {
  return (
    data.reduce((acc,  { username, email, first_name, last_name }, key) => ([
      ...acc,
      {
        uuid: username,
        username,
        isOpen: Boolean(opened[username]),
        cells: [ username, email, first_name, last_name ],
        selected: checkedRows.indexOf(username) !== -1
      }, {
        parent: key * 2,
        fullWidth: true,
        cells: [{ title: <ExpandableContent username={ username }
          email={ email }
          first_name={ first_name }
          last_name={ last_name }/> }]
      }
    ]), []));
};

