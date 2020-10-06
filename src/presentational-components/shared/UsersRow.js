import React from 'react';
import { RowWrapper } from '@patternfly/react-table';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const UsersRow = ({ row, ...props }) => {
  const { status } = row;
  const isActive = status?.props?.['data-is-active'];
  return <RowWrapper className={classNames('ins-c-rbac__user-row', { 'ins-m-inactive': !isActive })} row={row} {...props} />;
};

UsersRow.propTypes = {
  row: PropTypes.shape({
    status: PropTypes.shape({
      props: PropTypes.shape({
        data: PropTypes.shape({
          isActive: PropTypes.bool,
        }),
      }),
    }),
  }),
};

export default UsersRow;
