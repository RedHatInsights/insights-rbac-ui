import React from 'react';

import ExpandableDescription from './expandable-description';

export const createInitialRows = data => data.reduce((acc, { uuid, name, description, members }, key) => ([
  ...acc, {
    uuid,
    isOpen: false,
    cells: [ name, description, members.length ]
  }, {
    parent: key * 2,
    cells: [{ title: <ExpandableDescription description={ description } members={ members } /> }]
  }
]), []);

