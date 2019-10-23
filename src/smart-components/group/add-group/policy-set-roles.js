import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  Form,
  FormGroup,
  Stack,
  StackItem,
  Text,
  TextContent,
  TextVariants,
  Title
} from '@patternfly/react-core';
import RolesList from './roles-list';
import '../../../App.scss';

const PolicySetRoles = ({ selectedRoles, setSelectedRoles, title, description }) => {
  return (
    <Fragment>
      <Form>
        <Stack gutter="md">
          { title && <StackItem>
            <Title size="xl">{ title }</Title>
          </StackItem> }
          <StackItem>
            <TextContent>
              <Text component={ TextVariants.h6 }>{ description || 'Select at least one role to add to policy' }</Text>
            </TextContent>
          </StackItem>
          <StackItem>
            <FormGroup
              label="Select roles"
              fieldId="select-role"
            >
              <Card>
                <RolesList selectedRoles={ selectedRoles } setSelectedRoles={ setSelectedRoles }/>
              </Card>
            </FormGroup>
          </StackItem>
        </Stack>
      </Form>
    </Fragment>
  );
};

PolicySetRoles.propTypes = {
  selectedRoles: PropTypes.array,
  setSelectedRoles: PropTypes.func,
  roles: PropTypes.array,
  title: PropTypes.string,
  description: PropTypes.string
};

export default PolicySetRoles;

