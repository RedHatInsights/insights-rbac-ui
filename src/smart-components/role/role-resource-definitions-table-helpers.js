import messages from '../../Messages';

export const createRows = (data, isHosts, intl) => {
  let finalData = data;
  if (isHosts) {
    finalData = data.filter((item) => item !== null);
    if (finalData.length < data.length) {
      finalData = [intl.formatMessage(messages.ungroupedSystems), ...finalData];
    }
  }
  return finalData.reduce(
    (acc, value) => [
      ...acc,
      {
        cells: [value],
      },
    ],
    []
  );
};
