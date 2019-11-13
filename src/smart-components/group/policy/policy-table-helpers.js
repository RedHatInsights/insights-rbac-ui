import React, { Fragment } from 'react';
import ExpandableContent from './expandable-content';
import { DateFormat } from '@redhat-cloud-services/frontend-components';

export const createRows = (data, opened = [], checkedRows = []) => (
  data.reduce((acc,  { uuid, name, description, roles, modified }, key) => ([
    ...acc, {
      uuid,
      isOpen: Boolean(opened[uuid]),
      cells: [
        name,
        description,
        roles.length,
        <Fragment key={ `${uuid}-modified` }>
          <DateFormat date={ modified } type="relative" />
        </Fragment>
      ],
      selected: Boolean(checkedRows.find(row => row.uuid === uuid))
    }, {
      parent: key * 2,
      fullWidth: true,
      cells: [{ title: <ExpandableContent description={ description } roles={ roles }/> }]
    }
  ]), []));

