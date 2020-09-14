export const createRows = (data) => (
  data.reduce((acc, { permission }) => {
    const [ appName, type, operation ] = permission.split(':');
    return ([
      ...acc,
      {
        cells: [
          appName,
          type,
          operation
        ]
      }
    ]);
  }, [])
);
