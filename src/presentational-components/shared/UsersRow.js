import React from 'react';
import { RowWrapper } from '@patternfly/react-table';
import PropTypes from 'prop-types';

const UsersRow = ({ row, ...props }) => {
  const { status } = row;
  return <RowWrapper
    className={ `ins-c-rbac__user-row ${status?.props?.data?.isActive ? '' : 'ins-m-inactive'}` }
    row={ row }
    { ...props }
  />;
};

UsersRow.propTypes = {
  row: PropTypes.shape({
    status: PropTypes.shape({
      props: PropTypes.shape({
        data: PropTypes.shape({
          isActive: PropTypes.bool
        })
      })
    })
  })
};

export default UsersRow;
