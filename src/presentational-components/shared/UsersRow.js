import React from 'react';
import { RowWrapper } from '@patternfly/react-table';
import PropTypes from 'prop-types';

const UsersRow = ({ row, ...props }) => {
  const { username } = row;
  return <RowWrapper
    className={ `ins-c-rbac__user-row ${username?.props?.data?.isActive ? '' : 'ins-m-inactive'}` }
    row={ row }
    { ...props }
  />;
};

UsersRow.propTypes = {
  row: PropTypes.shape({
    username: PropTypes.shape({
      props: PropTypes.shape({
        data: PropTypes.shape({
          isActive: PropTypes.bool
        })
      })
    })
  })
};

export default UsersRow;
