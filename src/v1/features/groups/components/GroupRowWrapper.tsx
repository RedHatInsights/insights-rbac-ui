import React from 'react';
import { RowWrapper } from '@patternfly/react-table';
import classnames from 'classnames';

interface GroupRowWrapperProps {
  row: {
    isAdminDefault?: boolean;
    isPlatformDefault?: boolean;
    [key: string]: unknown;
  };
  className?: string;
  [key: string]: unknown;
}

export const GroupRowWrapper: React.FC<GroupRowWrapperProps> = ({ className, row, ...props }) => {
  return (
    <RowWrapper
      className={classnames(className, {
        'rbac-c-group-default': row.isPlatformDefault || row.isAdminDefault,
      })}
      row={row}
      {...props}
    />
  );
};
