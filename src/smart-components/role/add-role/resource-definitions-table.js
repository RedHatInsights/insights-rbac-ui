import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@patternfly/react-core';
import { Table, TableBody, TableHeader, TableVariant } from '@patternfly/react-table';

const ResourceDefinitionsTable = (formData, handleChange, editable = false) => {
  const { resourceDefinitions = []} = formData;

  // Resource definition table columns
  const columns = [
    { title: 'Key' },
    { title: 'Operation' },
    { title: 'value' },
    ''
  ];

  const rows = resourceDefinitions.map(definition => {
    return {
      cells: [
        { title: definition.key },
        { title: definition.operation },
        { title: definition.value },
        {
          title: editable ?
            <Button variant="link" isInline onClick={ () => handleChange(definition) }>
              Remove
            </Button>
            : null
        }
      ]
    };
  });

  return (
    <Table
      aria-label="Resource definitions"
      cells={ columns }
      rows={ rows }
      variant={ TableVariant.compact }
    >
      <TableHeader />
      <TableBody />
    </Table>
  );
};

ResourceDefinitionsTable.propTypes = {
  resourceDefinitions: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.number.isRequired,
    operation: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired
  }))
};

export default ResourceDefinitionsTable;
