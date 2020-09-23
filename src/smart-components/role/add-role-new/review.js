import React from 'react';
import useFormApi from '@data-driven-forms/react-form-renderer/dist/cjs/use-form-api';
import { Stack, StackItem, Grid, GridItem, Text, TextVariants } from '@patternfly/react-core';
import './review.scss';

const stickyTable = (columns, rows) => (
  <div className="ins-c-rbac__sticky">
    <Grid className="ins-c-rbac__sticky--title">
      {columns.map((col) => (
        <GridItem span={12 / columns.length} key={col}>
          {col}
        </GridItem>
      ))}
    </Grid>
    <Grid className="ins-c-rbac__sticky--data">
      {rows.map((row) =>
        row.cells.map((cell) => (
          <GridItem span={12 / columns.length} key={cell}>
            {cell}
          </GridItem>
        ))
      )}
    </Grid>
  </div>
);

const ReviewStep = () => {
  const formOptions = useFormApi();
  const {
    'role-name': name,
    'role-description': description,
    'role-copy-name': copyName,
    'role-copy-description': copyDescription,
    'add-permissions-table': permissions,
    'resource-definitions': resourceDefinitions,
  } = formOptions.getState().values;
  const columns = ['Application', 'Resource type', 'Operation'];
  const rows = permissions.map((permission) => ({
    cells: permission.uuid.split(':'),
  }));

  return (
    <React.Fragment>
      <Stack hasGutter>
        <StackItem className="ins-c-rbac__summary">
          <Grid>
            <GridItem span={2}>
              <Text component={TextVariants.h4} className="ins-c-rbac__bold-text">
                Name
              </Text>
            </GridItem>
            <GridItem span={10}>
              <Text component={TextVariants.p}>{name || copyName}</Text>
            </GridItem>
          </Grid>
          <Grid>
            <GridItem span={2}>
              <Text component={TextVariants.h4} className="ins-c-rbac__bold-text">
                Description
              </Text>
            </GridItem>
            <GridItem span={10}>
              <Text component={TextVariants.p}>{description || copyDescription}</Text>
            </GridItem>
          </Grid>
          <Grid>
            <GridItem span={2}>
              <Text component={TextVariants.h4} className="ins-c-rbac__bold-text">
                Permissions
              </Text>
            </GridItem>
            <GridItem span={10}>{stickyTable(columns, rows)}</GridItem>
          </Grid>
          {resourceDefinitions && (
            <Grid>
              <GridItem span={2}>
                <Text component={TextVariants.h4} className="ins-c-rbac__bold-text">
                  Resource definitions
                </Text>
              </GridItem>
              <GridItem span={10}>{stickyTable(['Permission', 'Resource definitions'], resourceDefinitions)}</GridItem>
            </Grid>
          )}
        </StackItem>
      </Stack>
    </React.Fragment>
  );
};

export default ReviewStep;
