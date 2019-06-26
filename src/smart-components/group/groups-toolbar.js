import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Pagination } from '@redhat-cloud-services/frontend-components/components/Pagination';
import { TableToolbar } from '@redhat-cloud-services/frontend-components/components/TableToolbar';
import { Button, Level, LevelItem, Toolbar, ToolbarGroup, ToolbarItem } from '@patternfly/react-core';

import { getCurrentPage } from '../../helpers/shared/helpers';
import GroupsFilterToolbar from '../../presentational-components/group/groups-filter-toolbar';

const GroupsToolbar = ({
  setFilterValue,
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
              <GroupsFilterToolbar onFilterChange={ value => setFilterValue(value) } filterValue={ filterValue }/>
            </ToolbarItem>
          </ToolbarGroup>
          <ToolbarGroup>
            <ToolbarItem>
            </ToolbarItem>
            <ToolbarItem>
              <Link to="/groups/add-group">
                <Button variant="primary" aria-label="Create Group">
                  Create Group
                </Button>
              </Link>
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

GroupsToolbar.propTypes = {
  setFilterValue: PropTypes.func.isRequired,
  filterValue: PropTypes.string.isRequired,
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
    count: PropTypes.number.isRequired
  }).isRequired,
  handleOnPerPageSelect: PropTypes.func.isRequired,
  handleSetPage: PropTypes.func.isRequired
};

export default GroupsToolbar;
