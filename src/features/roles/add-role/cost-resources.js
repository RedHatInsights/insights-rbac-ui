import React, { useEffect, useReducer } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { FormGroup, Grid, GridItem, Text, TextVariants, Tooltip } from '@patternfly/react-core';
import { Select, SelectOption, SelectVariant } from '@patternfly/react-core/deprecated';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { fetchResource, fetchResourceDefinitions } from '../../../redux/cost-management/actions';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';
import './cost-resources.scss';

const selector = ({ costReducer: { resourceTypes, isLoading, loadingResources, resources } }) => ({
  resourceTypes: resourceTypes.data,
  resources,
  isLoading,
  isLoadingResources: loadingResources > 0,
});

const reducer = (state, action) => {
  const prevState = state[action.key];
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
    case 'setOptions':
      return {
        ...state,
        [action.key]: {
          ...prevState,
          options: action.options,
          filteredOptions: action.options,
        },
      };
    case 'setFilter':
      return {
        ...state,
        [action.key]: {
          ...prevState,
          filteredOptions: prevState.options.filter(({ value }) => value.includes(action.filtervalue)),
        },
      };
    default:
      return state;
  }
};

const CostResources = (props) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const fetchData = (apiProps) => dispatch(fetchResourceDefinitions(apiProps));
  const getResource = (apiProps) => dispatch(fetchResource(apiProps));
  const { resourceTypes, isLoading, isLoadingResources, resources } = useSelector(selector, shallowEqual);
  const { input } = useFieldApi(props);
  const formOptions = useFormApi();
  const permissions = formOptions.getState().values['add-permissions-table'].filter(({ uuid }) => uuid.split(':')[0].includes('cost-management'));

  const [state, dispatchLocaly] = useReducer(
    reducer,
    permissions.reduce(
      (acc, permission) => ({
        ...acc,
        [permission.uuid]: {
          selected: [],
          options: [],
          filteredOptions: [],
          isOpen: false,
        },
      }),
      {},
    ),
  );
  const onToggle = (key, isOpen) => dispatchLocaly({ type: 'toggle', key, isOpen });
  const clearSelection = (key) => dispatchLocaly({ type: 'clear', key });
  const onSelect = (event, selection, selectAll, key) =>
    selectAll ? dispatchLocaly({ type: 'selectAll', selection, key }) : dispatchLocaly({ type: 'select', selection, key });

  const permissionToResource = (permission) => resourceTypes.find((r) => r.value === permission.split(':')?.[1])?.path.split('/')?.[5];

  useEffect(() => {
    (formOptions.getState().values['resource-definitions'] || []).map(({ permission, resources }) =>
      resources.map(
        (resource) =>
          permissions.find((item) => item?.uuid === permission) && dispatchLocaly({ type: 'select', selection: resource, key: permission }),
      ),
    );
    fetchData();
    formOptions.change('has-cost-resources', true);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const resourcePaths = [
        ...new Set(permissions.map((permission) => resourceTypes.find((r) => r.value === permission.uuid.split(':')?.[1])?.path)),
      ].filter((path) => path); // remove undefined
      resourcePaths.map((path) => getResource(path));
    }
  }, [resourceTypes]);

  useEffect(() => {
    if (!isLoadingResources) {
      permissions.map((p) => dispatchLocaly({ type: 'setOptions', key: p.uuid, options: resources[permissionToResource(p.uuid)] || [] }));
    }
  }, [isLoadingResources]);

  useEffect(() => {
    const resourceDefinitions = Object.entries(state).map(([permission, resources]) => ({ permission, resources: resources.selected }));
    input.onChange(resourceDefinitions);
    formOptions.change('resource-definitions', resourceDefinitions);
  }, [state]);

  const makeRow = ({ uuid: permission }) => {
    const options = state[permission].filteredOptions;
    return (
      <React.Fragment>
        <GridItem md={4} sm={12}>
          <Tooltip content={<div>{permission}</div>}>
            <FormGroup label={permission.replace(/^cost-management:/, '')} isRequired></FormGroup>
          </Tooltip>
        </GridItem>
        <GridItem md={8} sm={12}>
          <Select
            className="rbac-m-resource-type-select"
            variant={SelectVariant.checkbox}
            typeAheadAriaLabel={intl.formatMessage(messages.selectState)}
            onToggle={(_event, isOpen) => {
              dispatchLocaly({ type: 'setFilter', key: permission, filtervalue: '' });
              onToggle(permission, isOpen);
            }}
            onSelect={(event, selection) => {
              onSelect(event, selection, selection === intl.formatMessage(messages.selectAll, { length: options.length }), permission);
            }}
            onClear={() => clearSelection(permission)}
            selections={state[permission].selected}
            isOpen={state[permission].isOpen}
            onFilter={(e) => e && dispatchLocaly({ type: 'setFilter', key: permission, filtervalue: e.target.value })}
            aria-labelledby={permission}
            placeholderText={intl.formatMessage(messages.selectResources)}
            hasInlineFilter
          >
            {[
              <SelectOption key={0} value={intl.formatMessage(messages.selectAll, { length: options.length })} />,
              ...options.map((option, index) => <SelectOption key={index + 1} value={option.value} />),
            ]}
          </Select>
        </GridItem>
      </React.Fragment>
    );
  };

  return (
    <Grid hasGutter>
      <GridItem md={4} className="rbac-m-hide-on-sm">
        <Text component={TextVariants.h4} className="rbac-bold-text">
          {intl.formatMessage(messages.permissions)}
        </Text>
      </GridItem>
      <GridItem md={8} className="rbac-m-hide-on-sm">
        <Text component={TextVariants.h4} className="rbac-bold-text">
          {intl.formatMessage(messages.resourceDefinitions)}
        </Text>
      </GridItem>
      {permissions.map(makeRow)}
    </Grid>
  );
};

export default CostResources;
