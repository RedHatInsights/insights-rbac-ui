import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';
import { RowWrapper } from '@patternfly/react-table';

export const DisabledRowWrapper = ({ row, ...props }) =>
  row.disableSelection ? (
    <Tooltip content={row.disabledContent} exitDelay={1500} entryDelay={1500}>
      <RowWrapper className="rbac-c-disabled-row" row={row} {...props} />
    </Tooltip>
  ) : (
    <RowWrapper row={row} {...props} />
  );

DisabledRowWrapper.propTypes = {
  props: PropTypes.object,
  row: PropTypes.object,
};
