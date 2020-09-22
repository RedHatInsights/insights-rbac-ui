import { Button, Modal } from '@patternfly/react-core';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';
import { defaultSettings } from '../../helpers/shared/pagination';

const ResourceDefinitionsModal = ({ isOpen, handleClose, permission, resourceDefinitions }) => {
  const columns = [''];
  const [{ rows, pagination, filterValue }, setRows] = useState(() => ({
    filterValue: '',
    rows: resourceDefinitions.map(({ attributeFilter: { value } }) => value).slice(0, defaultSettings.limit),
    pagination: {
      ...defaultSettings,
      count: resourceDefinitions.length,
    },
  }));

  const handleFilterValue = ({ name = '', limit, offset }, isFilter = false) =>
    setRows(({ pagination, filterValue }) => {
      const rows = resourceDefinitions
        .map(({ attributeFilter: { value } }) => value)
        .filter((value) => value.includes(name))
        .slice(offset, limit);
      return {
        rows,
        filterValue: isFilter ? name : filterValue,
        pagination: {
          ...pagination,
          offset: isFilter ? 0 : offset,
          limit,
          count: rows.length,
        },
      };
    });

  return (
    <Modal
      actions={[
        <Button key="close-action" variant="primary" onClick={handleClose}>
          Close
        </Button>,
      ]}
      variant="large"
      isOpen={isOpen}
      onClose={handleClose}
      title="Resource definitions"
      description={
        <p>
          View resource definitions for the <strong>{permission}</strong> permission
        </p>
      }
    >
      <TableToolbarView
        columns={columns}
        data={rows}
        filterValue={filterValue}
        setFilterValue={(config) => handleFilterValue(config, true)}
        pagination={pagination}
        noData={resourceDefinitions.length === 0}
        createRows={(data) => data.map((value) => ({ cells: [value] }))}
        titlePlural="Resource definitions"
        titleSingular="Resource definition"
        noDataDescription={[`There are no resource definitions for ${permission} permission`]}
        fetchData={handleFilterValue}
      />
    </Modal>
  );
};

ResourceDefinitionsModal.propTypes = {
  isOpen: PropTypes.bool,
  handleClose: PropTypes.func.isRequired,
  permission: PropTypes.string.isRequired,
  resourceDefinitions: PropTypes.arrayOf(
    PropTypes.shape({
      attributeFilter: PropTypes.shape({
        value: PropTypes.string.isRequired,
      }).isRequired,
    })
  ).isRequired,
};

export default ResourceDefinitionsModal;
