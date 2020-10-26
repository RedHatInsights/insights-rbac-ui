export const createRows = (data) =>
  data.reduce(
    (acc, { attributeFilter }) => [
      ...acc,
      {
        cells: [attributeFilter.value],
      },
    ],
    []
  );
