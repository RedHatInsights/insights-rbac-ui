import React from 'react';
import { RowWrapper } from '@patternfly/react-table';
import { RowWrapperProps } from '@patternfly/react-table';
import classNames from 'classnames';

const UsersRow = ({ row, ...props }: RowWrapperProps) => {
  const { status } = row || {};
  const isActive = status?.props?.['data-is-active'];
  return <RowWrapper className={classNames('rbac__user-row', { 'ins-m-inactive': !isActive })} row={row} {...props} />;
};

export { UsersRow };
