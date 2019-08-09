import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Pagination } from '@redhat-cloud-services/frontend-components/components/Pagination';
import { TableToolbar } from '@redhat-cloud-services/frontend-components/components/TableToolbar';
import { Button, Level, LevelItem, Toolbar, ToolbarGroup, ToolbarItem } from '@patternfly/react-core';

import { getCurrentPage } from '../../helpers/shared/helpers';
import PrincipalsFilterToolbar from '../../presentational-components/principal/principals-filter-toolbar';

const PrincipalsToolbar = ({
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
              <PrincipalsFilterToolbar onFilterChange={ value => onFilterChange(value) } filterValue={ filterValue }/>
            </ToolbarItem>
          </ToolbarGroup>
          <ToolbarGroup>
            <ToolbarItem>
            </ToolbarItem>
            <ToolbarItem>
              <Link to="/principals/add-principal">
                <Button variant="primary" aria-label="Add member">
                  Add member
                </Button>
              </Link>
            </ToolbarItem>
            <ToolbarItem>
              <Link to="/principals/remove-principal">
                <Button variant="primary" aria-label="Remove member">
                  remove member
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

PrincipalsToolbar.propTypes = {
  onFilterChange: PropTypes.func.isRequired,
  filterValue: PropTypes.string.isRequired,
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
    count: PropTypes.number.isRequired
  }).isRequired,
  handleOnPerPageSelect: PropTypes.func.isRequired,
  handleSetPage: PropTypes.func.isRequired
};

export default PrincipalsToolbar;
