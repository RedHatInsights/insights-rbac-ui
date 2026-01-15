import React from 'react';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';
import { RowWrapper } from '@patternfly/react-table';

interface RowData {
  disableSelection?: boolean;
  disabledContent?: React.ReactNode;
  [key: string]: unknown;
}

interface DisabledRowWrapperProps {
  row: RowData;
  [key: string]: unknown;
}

export const DisabledRowWrapper: React.FC<DisabledRowWrapperProps> = ({ row, ...props }) =>
  row.disableSelection ? (
    <Tooltip content={row.disabledContent} exitDelay={1500} entryDelay={1500}>
      <RowWrapper className="rbac-c-disabled-row" row={row} {...props} />
    </Tooltip>
  ) : (
    <RowWrapper row={row} {...props} />
  );
