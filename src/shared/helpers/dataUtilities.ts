export const BAD_UUID = 'bad uuid';

// Type for table row data that must have a uuid field
export interface RowData {
  uuid: string;
  [key: string]: unknown;
}

// Generic type for mappedProps - accepts any object type and filters out falsy values
export const mappedProps = <T extends Record<string, unknown>>(apiProps: T): Partial<T> =>
  Object.entries(apiProps).reduce((acc, [key, value]) => {
    if (value) {
      (acc as Record<string, unknown>)[key] = value;
    }
    return acc;
  }, {} as Partial<T>);

export const calculateChecked = (
  rows: RowData[] = [],
  selected: RowData[],
  isRowSelectable: (row: RowData) => boolean = () => true,
): boolean | null => {
  const nonDefaults = rows.filter(isRowSelectable);
  return (
    (nonDefaults.length !== 0 && nonDefaults.every(({ uuid }) => selected.find((row) => row.uuid === uuid))) || (selected.length > 0 ? null : false)
  );
};

export const selectedRows =
  (newSelection: RowData[], isSelected: boolean) =>
  (selected: RowData[]): RowData[] => {
    if (!isSelected) {
      return selected.filter((row) => !newSelection.find(({ uuid }) => row.uuid === uuid));
    }
    return [...selected, ...newSelection].filter((row, key, arr) => arr.findIndex(({ uuid }) => row.uuid === uuid) === key);
  };

export const isExternalIdp = (token: string = ''): boolean => {
  let roles: string[] = [''];
  let tokenArray = token.split('.');
  if (tokenArray.length > 1) {
    let token1 = window.atob(tokenArray[1]);
    if (token1) {
      try {
        const parsed = JSON.parse(token1) as { realm_access?: { roles?: string[] } };
        roles = parsed?.realm_access?.roles || [];
        if (roles.includes('external-idp')) {
          return true;
        }
      } catch {
        // Invalid JSON, ignore
      }
    }
  }
  return false;
};
