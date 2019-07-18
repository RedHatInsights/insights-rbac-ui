import React, { Fragment, useEffect, useState } from 'react';
import propTypes from 'prop-types';
import debouncePromise from 'awesome-debounce-promise';
import { Toolbar, ToolbarGroup, ToolbarItem, Level, LevelItem } from '@patternfly/react-core';
import { Table, TableHeader, TableBody } from '@patternfly/react-table';
import { Pagination } from '@redhat-cloud-services/frontend-components/components/Pagination';
import { scrollToTop, getCurrentPage, getNewPage } from '../../helpers/shared/helpers';
import FilterToolbar from '../../presentational-components/shared/filter-toolbar-item';
import { Section } from '@redhat-cloud-services/frontend-components';
import { TableToolbar } from '@redhat-cloud-services/frontend-components/components/TableToolbar';
import { DataListLoader } from './loader-placeholders';

export const TableToolbarView = ({
  request,
  isSelectable,
  createInitialRows,
  columns,
  toolbarButtons,
  fetchData,
  data,
  actionResolver,
  routes,
  titlePlural,
  titleSingular,
  pagination,
  setCheckedItems }) => {
  const [ filterValue, setFilterValue ] = useState('');
  const [ rows, setRows ] = useState([]);
  const [ isLoading ] = useState(false);

  useEffect(() => {
    fetchData(setRows);
    scrollToTop();
  }, []);

  useEffect(() => {
    setRows(createInitialRows(data));
  }, [ data ]);

  const handleOnPerPageSelect = limit => request({
    offset: pagination.offset,
    limit
  }).then(() => setRows(createInitialRows(data)));

  const handleSetPage = (number, debounce) => {
    const options = {
      offset: getNewPage(number, pagination.limit),
      limit: pagination.limit
    };
    const requestFunc = () => request(options);
    return debounce ? debouncePromise(request, 250)() : requestFunc().then(({ value: { data }}) => setRows(createInitialRows(data)));
  };

  const setOpen = (data, id) => data.map(row => row.id === id ?
    {
      ...row,
      isOpen: !row.isOpen
    } : {
      ...row
    });

  const setSelected = (data, id) => {
    const newData = data.map(row => row.id === id ?
      {
        ...row,
        selected: !row.selected
      } : {
        ...row
      });

    let checkedItems = newData.filter(item => (item.id && item.selected));
    setCheckedItems(checkedItems);
    return newData;
  };

  const onCollapse = (_event, _index, _isOpen, { id }) => setRows((rows) => setOpen(rows, id));

  const selectRow = (_event, selected, index, { id } = {}) => index === -1
    ? setRows(rows.map(row => ({ ...row, selected })))
    : setRows((rows) => setSelected(rows, id));

  const renderToolbar = () => <TableToolbar>
    <Level style={ { flex: 1 } }>
      <LevelItem>
        <Toolbar>
          <FilterToolbar onFilterChange={ value => setFilterValue(value) } searchValue={ filterValue } placeholder={ `Filter by ${titleSingular}` } />
          { toolbarButtons() }
        </Toolbar>
      </LevelItem>

      <LevelItem>
        <Toolbar>
          <ToolbarGroup>
            <ToolbarItem>
              <Pagination
                itemsPerPage={ pagination.limit || 10 }
                numberOfItems={ pagination.count || 10 }
                onPerPageSelect={ handleOnPerPageSelect }
                page={ getCurrentPage(pagination.limit, pagination.offset) }
                onSetPage={ handleSetPage }
                direction="down"
              />
            </ToolbarItem>
          </ToolbarGroup>
        </Toolbar>
      </LevelItem>
    </Level>
  </TableToolbar>;

  if (isLoading) {
    return <DataListLoader/>;
  }

  return (
    <Fragment>
      <Section className="data-table-pane" page-type={ `tab-${titlePlural}` } id={ `tab-${titlePlural}` }>
        { routes() }
        { renderToolbar() }
        <Table
          aria-label={ `${titlePlural} table` }
          onCollapse={ onCollapse }
          rows={ rows }
          cells={ columns }
          onSelect={ isSelectable && selectRow }
          actionResolver={ actionResolver }
          className="table-fix"
        >
          <TableHeader />
          <TableBody />
        </Table>
      </Section>
    </Fragment>
  );
};

TableToolbarView.propTypes = {
  isSelectable: propTypes.bool,
  createInitialRows: propTypes.func.isRequired,
  request: propTypes.func.isRequired,
  columns: propTypes.array.isRequired,
  toolbarButtons: propTypes.func,
  fetchData: propTypes.func.isRequired,
  data: propTypes.array,
  pagination: propTypes.shape({
    limit: propTypes.number.isRequired,
    offset: propTypes.number.isRequired,
    count: propTypes.number.isRequired
  }),
  titlePlural: propTypes.string,
  titleSingular: propTypes.string,
  routes: propTypes.func,
  actionResolver: propTypes.func,
  setCheckedItems: propTypes.func
};

TableToolbarView.defaultProps = {
  requests: [],
  pagination: '',
  toolbarButtons: () => null,
  isSelectable: null,
  routes: () => null
};
