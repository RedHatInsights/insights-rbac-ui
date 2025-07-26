import React from 'react';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { Grid, GridItem, Stack, StackItem, Text, TextVariants } from '@patternfly/react-core';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';
import './review.scss';
import { useFlag } from '@unleash/proxy-client-react';

const stickyTable = (columns, rows) => (
  <div className="rbac-c-sticky">
    <Grid className="rbac-c-sticky--title">
      {columns.map((col) => (
        <GridItem span={12 / columns.length} key={col}>
          {col}
        </GridItem>
      ))}
    </Grid>
    <Grid className="rbac-c-sticky--data">
      {rows.map((row) =>
        row.cells.map((cell) => (
          <GridItem span={12 / columns.length} key={cell}>
            {cell}
          </GridItem>
        )),
      )}
    </Grid>
  </div>
);

const ReviewStep = () => {
  const intl = useIntl();
  const enableWorkspacesNameChange = useFlag('platform.rbac.groups-to-workspaces-rename');
  const formOptions = useFormApi();
  const {
    'role-name': name,
    'role-description': description,
    'role-copy-name': copyName,
    'role-copy-description': copyDescription,
    'add-permissions-table': permissions,
    'resource-definitions': resourceDefinitions,
    'has-cost-resources': hasCostResources,
    'inventory-group-permissions': inventoryGroupPermissions,
    'role-type': type,
  } = formOptions.getState().values;
  const columns = [intl.formatMessage(messages.application), intl.formatMessage(messages.resourceType), intl.formatMessage(messages.operation)];
  const rows = permissions.map((permission) => ({
    cells: permission.uuid.split(':'),
  }));

  const resourceDefinitionsRows = (resourceDefinitions || []).map(({ permission, resources }) => ({
    cells: [permission, resources.join(', ')],
  }));

  const groupPermissionsRows = (inventoryGroupPermissions || []).map(({ permission, groups }) => ({
    cells: [permission, groups?.map((group) => (group?.id === null ? intl.formatMessage(messages.ungroupedSystems) : group?.name)).join(', ')],
  }));

  return (
    <React.Fragment>
      <Stack>
        <StackItem className="rbac-l-stack__item-summary">
          <Grid>
            <GridItem sm={12} md={2}>
              <Text component={TextVariants.h4} className="rbac-bold-text">
                {intl.formatMessage(messages.name)}
              </Text>
            </GridItem>
            <GridItem sm={12} md={10}>
              <Text component={TextVariants.p}>{type === 'create' ? name : copyName}</Text>
            </GridItem>
          </Grid>
          <Grid>
            <GridItem sm={12} md={2}>
              <Text component={TextVariants.h4} className="rbac-bold-text">
                {intl.formatMessage(messages.description)}
              </Text>
            </GridItem>
            <GridItem sm={12} md={10}>
              <Text component={TextVariants.p}>{type === 'create' ? description : copyDescription}</Text>
            </GridItem>
          </Grid>
          <Grid>
            <GridItem sm={12} md={2}>
              <Text component={TextVariants.h4} className="rbac-bold-text">
                {intl.formatMessage(messages.permissions)}
              </Text>
            </GridItem>
            <GridItem sm={12} md={10}>
              {stickyTable(columns, rows)}
            </GridItem>
          </Grid>
          {inventoryGroupPermissions && (
            <Grid>
              <GridItem sm={12} md={2}>
                <Text component={TextVariants.h4} className="rbac-bold-text">
                  {intl.formatMessage(messages.resourceDefinitions)}
                </Text>
              </GridItem>
              <GridItem sm={12} md={10}>
                {stickyTable(
                  [
                    intl.formatMessage(messages.permission),
                    intl.formatMessage(enableWorkspacesNameChange ? messages.workspacesDefinition : messages.groupDefinition),
                  ],
                  groupPermissionsRows,
                )}
              </GridItem>
            </Grid>
          )}
          {hasCostResources && (
            <Grid>
              <GridItem sm={12} md={2}>
                <Text component={TextVariants.h4} className="rbac-bold-text">
                  {intl.formatMessage(messages.resourceDefinitions)}
                </Text>
              </GridItem>
              <GridItem sm={12} md={10}>
                {stickyTable([intl.formatMessage(messages.permission), intl.formatMessage(messages.resourceDefinitions)], resourceDefinitionsRows)}
              </GridItem>
            </Grid>
          )}
        </StackItem>
      </Stack>
    </React.Fragment>
  );
};

export default ReviewStep;
