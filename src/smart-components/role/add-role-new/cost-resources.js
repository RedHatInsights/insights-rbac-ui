/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useReducer } from 'react';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { Select, SelectOption, SelectVariant, TextContent, Grid, GridItem, Text, TextVariants, FormGroup } from '@patternfly/react-core';
import useFieldApi from '@data-driven-forms/react-form-renderer/dist/cjs/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/dist/cjs/use-form-api';

const selector = ({ roleReducer: { rolesForWizard, isLoading } }) => ({
  roles: rolesForWizard.data,
  pagination: rolesForWizard.meta,
  isLoading,
});
const options = [
  { value: 'Alabama', disabled: false },
  { value: 'Florida', disabled: false },
  { value: 'New Jersey', disabled: false },
  { value: 'New Mexico', disabled: false, description: 'This is a description' },
  { value: 'New York', disabled: false },
  { value: 'North Carolina', disabled: false },
];

const reducer = (state, action) => {
  console.log('REDUCER', state, action);
  const prevState = state[action.key];
  console.log(prevState);
  switch (action.type) {
    case 'toggle':
      return {
        ...state,
        [action.key]: {
          ...prevState,
          isOpen: !prevState.isOpen,
        },
      };
    case 'select':
      return {
        ...state,
        [action.key]: {
          ...prevState,
          selected: prevState.selected.includes(action.selection)
            ? prevState.selected.filter((item) => item !== action.selection)
            : [...prevState.selected, action.selection],
        },
      };
    case 'selectAll':
      return {
        ...state,
        [action.key]: {
          ...prevState,
          selected: prevState.options.map((option) => option.value),
        },
      };
    case 'clear':
      return {
        ...state,
        [action.key]: {
          ...prevState,
          selected: [],
        },
      };
    default:
      return state;
  }
};

const CostResources = (props) => {
  const dispatch = useDispatch();
  const { input } = useFieldApi(props);
  const formOptions = useFormApi();
  const { 'add-permissions-table': permissions } = formOptions.getState().values;
  const [state, dispatchLocaly] = useReducer(
    reducer,
    permissions.reduce(
      (acc, permission) => ({
        ...acc,
        [permission.uuid]: {
          selected: [],
          options,
          isOpen: false,
        },
      }),
      {}
    )
  );

  useEffect(() => {
    const resourceDefinitions = Object.entries(state).map(([permission, resources]) => ({ permission, resources: resources.selected }));
    input.onChange(resourceDefinitions);
    formOptions.change('resource-definitions', resourceDefinitions);
  }, [state]);

  const onToggle = (key, isOpen) => dispatchLocaly({ type: 'toggle', key, isOpen });
  const clearSelection = (key) => dispatchLocaly({ type: 'clear', key });
  const onSelect = (event, selection, selectAll, key) =>
    selectAll ? dispatchLocaly({ type: 'selectAll', selection, key }) : dispatchLocaly({ type: 'select', selection, key });

  // eslint-disable-next-line react/prop-types
  const makeRow = ({ uuid: permission }) => (
    <React.Fragment>
      <GridItem span={3}>
        <FormGroup label={permission} isRequired></FormGroup>
      </GridItem>
      <GridItem span={9}>
        <Select
          className="ins-c-rbac-cost-resource-select"
          variant={SelectVariant.checkbox}
          typeAheadAriaLabel="Select a state"
          onToggle={(isOpen) => onToggle(permission, isOpen)}
          onSelect={(event, selection, isPlaceholder) => {
            onSelect(event, selection, selection === 'Select All (6)', permission);
          }}
          onClear={() => clearSelection(permission)}
          selections={state[permission].selected}
          isOpen={state[permission].isOpen}
          onFilter={() => null}
          aria-labelledby={permission}
          placeholderText="Select resources"
          hasInlineFilter
        >
          {[
            <SelectOption key={0} value={`Select All (${options.length})`} isPlaceholder={true} />,
            ...options.map((option, index) => (
              <SelectOption
                isDisabled={option.disabled}
                key={index + 1}
                value={option.value}
                {...(option.description && { description: option.description })}
                isPlaceholder={option.isPlaceholder}
              />
            )),
          ]}
        </Select>
      </GridItem>
    </React.Fragment>
  );

  useEffect(() => {}, []);

  return (
    <Grid hasGutter>
      <GridItem span={3}>
        <Text component={TextVariants.h4} className="ins-c-rbac__bold-text">
          Cost management permissions
        </Text>
      </GridItem>
      <GridItem span={9}>
        <Text component={TextVariants.h4} className="ins-c-rbac__bold-text">
          Resource definitions
        </Text>
      </GridItem>
      {permissions.map(makeRow)}
    </Grid>
  );
};

export default CostResources;
