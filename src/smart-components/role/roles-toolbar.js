import React from 'react';
import PropTypes from 'prop-types';
import { Pagination } from '@redhat-cloud-services/frontend-components/components/Pagination';
import { TableToolbar } from '@redhat-cloud-services/frontend-components/components/TableToolbar';
import { Level, LevelItem, Toolbar, ToolbarGroup, ToolbarItem } from '@patternfly/react-core';

import { getCurrentPage } from '../../helpers/shared/helpers';
import RolesFilterToolbar from '../../presentational-components/role/roles-filter-toolbar';

const RolesToolbar = ({
  onFilterChange,
  filterValue,
  pagination,
  handleOnPerPageSelect,
  handleSetPage
}) => (
  <TableToolbar>
    <Level style={ { flex: 1 } }>
      <LevelItem>
        <Toolbar>
          <ToolbarGroup>
            <ToolbarItem>
              <RolesFilterToolbar onFilterChange={ value => onFilterChange(value) } filterValue={ filterValue }/>
            </ToolbarItem>
          </ToolbarGroup>
        </Toolbar>
      </LevelItem>
      <LevelItem>
        <Pagination
          itemsPerPage={ pagination.limit }
          numberOfItems={ pagination.count }
          onPerPageSelect={ handleOnPerPageSelect }
          page={ getCurrentPage(pagination.limit, pagination.offset) }
          onSetPage={ handleSetPage }
          direction="down"
        />
      </LevelItem>
    </Level>
  </TableToolbar>
);

RolesToolbar.propTypes = {
  onFilterChange: PropTypes.func.isRequired,
  filterValue: PropTypes.string.isRequired,
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
    count: PropTypes.number.isRequired
  }).isRequired,
  handleOnPerPageSelect: PropTypes.func.isRequired,
  handleSetPage: PropTypes.func.isRequired
};

export default RolesToolbar;
