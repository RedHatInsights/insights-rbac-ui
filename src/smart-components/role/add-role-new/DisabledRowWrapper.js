import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from '@patternfly/react-core';
import { RowWrapper } from '@patternfly/react-table';

export const DisabledRowWrapper = ({ row, ...props }) =>
  row.disableSelection ? (
    <Tooltip
      content={
        <div>
          To add this permission to your role and define specific resources for it, at least one data source must be connected.{' '}
          <a href="./settings/sources">Configure sources for Cost Management</a>
        </div>
      }
      exitDelay={1500}
      entryDelay={1500}
    >
      <RowWrapper className="ins-c-rbac-disabled-row" row={row} {...props} />
    </Tooltip>
  ) : (
    <RowWrapper row={row} {...props} />
  );

DisabledRowWrapper.propTypes = {
  props: PropTypes.object,
  row: PropTypes.object,
};
