import React from 'react';
import { RowWrapper } from '@patternfly/react-table';
import classnames from 'classnames';

interface RowData {
  system?: boolean;
  [key: string]: unknown;
}

interface RoleRowWrapperProps {
  className?: string;
  row: RowData;
  [key: string]: unknown;
}

const RoleRowWrapper: React.FC<RoleRowWrapperProps> = ({ className, row, ...props }) => {
  return (
    <RowWrapper
      className={classnames(className, {
        'rbac-c-role-default': row.system,
      })}
      row={row}
      {...props}
    />
  );
};

export default RoleRowWrapper;
