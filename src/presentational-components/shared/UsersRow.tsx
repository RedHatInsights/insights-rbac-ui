import React from 'react';
import { RowWrapper } from '@patternfly/react-table';
import classNames from 'classnames';

interface UsersRowProps {
  row: {
    cells?: any[];
    status?: {
      props?: {
        'data-is-active'?: boolean;
        data?: {
          isActive?: boolean;
        };
      };
    };
    [key: string]: any;
  };
  [key: string]: any;
}

const UsersRow: React.FC<UsersRowProps> = ({ row, ...props }) => {
  const { status } = row;
  const isActive = status?.props?.['data-is-active'];
  return <RowWrapper className={classNames('rbac__user-row', { 'ins-m-inactive': !isActive })} row={row} {...props} />;
};

export default UsersRow;
