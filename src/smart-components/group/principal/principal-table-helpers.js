export const createRows = (data, _opened, checkedRows = []) => {
  return (
    data.reduce((acc,  { username, email, first_name, last_name }) => ([
      ...acc,
      {
        uuid: username,
        username,
        cells: [ username, email, last_name, first_name ],
        selected: checkedRows.find(row => row.uuid === username)
      }
    ]), []));
};

