import React from 'react';
import { RowWrapper } from '@patternfly/react-table';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const RoleRowWrapper = ({ className, row, ...props }) => {
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

RoleRowWrapper.propTypes = {
  row: PropTypes.shape({
    system: PropTypes.bool,
  }),
  className: PropTypes.string,
};

export default RoleRowWrapper;
