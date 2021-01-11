import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Card, Form, FormGroup, Stack, StackItem, Text, TextContent, Title } from '@patternfly/react-core';
import RolesList from './roles-list';
import '../../../App.scss';

const SetRoles = ({ selectedRoles, setSelectedRoles, title, description }) => {
  return (
    <Fragment>
      <Form>
        <Stack hasGutter>
          {title && (
            <StackItem>
              <Title headingLevel="h4" size="xl">
                {title}
              </Title>
            </StackItem>
          )}
          <StackItem>
            <TextContent>
              <Title headingLevel="h4" size="xl">
                Add roles
              </Title>
              <Text>{description || 'Select one or more roles to add to this group.'}</Text>
            </TextContent>
          </StackItem>
          <StackItem>
            <FormGroup fieldId="select-role">
              <Card>
                <RolesList selectedRoles={selectedRoles} setSelectedRoles={setSelectedRoles} />
              </Card>
            </FormGroup>
          </StackItem>
        </Stack>
      </Form>
    </Fragment>
  );
};

SetRoles.propTypes = {
  selectedRoles: PropTypes.array,
  setSelectedRoles: PropTypes.func,
  title: PropTypes.string,
  description: PropTypes.string,
};

export default SetRoles;
