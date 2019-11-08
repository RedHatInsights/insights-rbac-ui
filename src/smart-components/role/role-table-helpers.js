import { timeAgo } from '../../helpers/shared/helpers';

export const createRows = (data, filterValue = undefined) => (
  data.filter(item => { const filter = filterValue ? item.name.includes(filterValue) : true;
    return filter;
  }).reduce((acc, { uuid, name, description, system, policyCount, modified }) => ([
    ...acc, {
      uuid,
      system,
      cells: [ name, description, policyCount, `${timeAgo(modified)}` ]
    }
  ]), [])
);
