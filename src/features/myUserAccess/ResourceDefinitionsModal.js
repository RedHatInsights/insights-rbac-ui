import { Button, Modal } from '@patternfly/react-core';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { TableToolbarView } from '../../components/tables/TableToolbarView';
import { defaultSettings } from '../../helpers/pagination';
import { FormattedMessage, useIntl } from 'react-intl';
import messages from '../../Messages';

const ResourceDefinitionsModal = ({ isOpen, handleClose, permission, resourceDefinitions }) => {
  const intl = useIntl();
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
          {intl.formatMessage(messages.close)}
        </Button>,
      ]}
      variant="large"
      isOpen={isOpen}
      onClose={handleClose}
      title={intl.formatMessage(messages.resourceDefinitions)}
      description={
        <FormattedMessage
          {...messages.viewResourceDefinitions}
          values={{
            strong: (text) => <strong>{text}</strong>,
            permission,
          }}
        />
      }
    >
      <TableToolbarView
        columns={columns}
        data={rows}
        filterValue={filterValue}
        setFilterValue={(config) => handleFilterValue(config, true)}
        pagination={pagination}
        ouiaId="resource-definition-table"
        noData={resourceDefinitions.length === 0}
        rows={rows.map((value) => ({ cells: [value] }))}
        titlePlural={intl.formatMessage(messages.resourceDefinitions)}
        titleSingular={intl.formatMessage(messages.resourceDefinition)}
        noDataDescription={[intl.formatMessage(messages.resourceDefinition, { permission: permission })]}
        fetchData={handleFilterValue}
        tableId="resource-definitions-modal"
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
    }),
  ).isRequired,
};

export default ResourceDefinitionsModal;
