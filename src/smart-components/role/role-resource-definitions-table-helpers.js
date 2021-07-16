export const createRows = (data) =>
  data.reduce(
    (acc, value) => [
      ...acc,
      {
        cells: [value],
      },
    ],
    []
  );
