import React from 'react';
import { RowWrapper } from '@patternfly/react-table';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const GroupRowWrapper = ({ className, row, ...props }) => {
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

GroupRowWrapper.propTypes = {
  row: PropTypes.shape({
    isAdminDefault: PropTypes.bool,
    isPlatformDefault: PropTypes.bool,
  }),
  className: PropTypes.string,
};

export default GroupRowWrapper;
