import React, { useEffect, useReducer } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Grid } from '@patternfly/react-core';
import { GridItem } from '@patternfly/react-core';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { TextVariants } from '@patternfly/react-core/dist/dynamic/components/Text';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';
import { Select, SelectOption, SelectVariant } from '@patternfly/react-core/deprecated';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { fetchResource, fetchResourceDefinitions } from '../../../redux/cost-management/actions';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';
import './cost-resources.scss';
import type { RBACStore } from '../../../redux/store.d';

interface ResourceType {
  value: string;
  path: string;
}

interface Option {
  value: string;
}

interface PermissionState {
  selected: string[];
  options: Option[];
  filteredOptions: Option[];
  isOpen: boolean;
}

type State = Record<string, PermissionState>;

type Action =
  | { type: 'toggle'; key: string; isOpen?: boolean }
  | { type: 'select'; selection: string; key: string }
  | { type: 'selectAll'; selection: string; key: string }
  | { type: 'clear'; key: string }
  | { type: 'setOptions'; key: string; options: Option[] }
  | { type: 'setFilter'; key: string; filtervalue: string };

const selector = ({ costReducer: { resourceTypes, isLoading, loadingResources, resources } }: RBACStore) => ({
  resourceTypes: (resourceTypes?.data || []) as unknown as ResourceType[],
  resources: resources as Record<string, Option[]>,
  isLoading: isLoading as boolean,
  isLoadingResources: ((loadingResources as number) || 0) > 0,
});

const reducer = (state: State, action: Action): State => {
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

interface CostResourcesProps {
  name: string;
  [key: string]: unknown;
}

const CostResources: React.FC<CostResourcesProps> = (props) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const fetchData = (apiProps?: Record<string, unknown>) => dispatch(fetchResourceDefinitions(apiProps || {}) as unknown as { type: string });
  const getResource = (apiProps: string) => dispatch(fetchResource({ path: apiProps }) as unknown as { type: string });
  const { resourceTypes, isLoading, isLoadingResources, resources } = useSelector(selector, shallowEqual);
  const { input } = useFieldApi(props);
  const formOptions = useFormApi();
  const permissions = (formOptions.getState().values['add-permissions-table'] as { uuid: string }[]).filter(({ uuid }) =>
    uuid.split(':')[0].includes('cost-management'),
  );

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
      {} as State,
    ),
  );
  const onToggle = (key: string) => dispatchLocaly({ type: 'toggle', key });
  const clearSelection = (key: string) => dispatchLocaly({ type: 'clear', key });
  const onSelect = (_event: unknown, selection: string, selectAll: boolean, key: string) =>
    selectAll ? dispatchLocaly({ type: 'selectAll', selection, key }) : dispatchLocaly({ type: 'select', selection, key });

  const permissionToResource = (permission: string) => resourceTypes.find((r) => r.value === permission.split(':')?.[1])?.path.split('/')?.[5];

  useEffect(() => {
    ((formOptions.getState().values['resource-definitions'] as { permission: string; resources: string[] }[]) || []).map(
      ({ permission, resources: resourceList }) =>
        resourceList.map(
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
      ].filter((path): path is string => Boolean(path));
      resourcePaths.map((path) => getResource(path));
    }
  }, [resourceTypes]);

  useEffect(() => {
    if (!isLoadingResources) {
      permissions.map((p) => dispatchLocaly({ type: 'setOptions', key: p.uuid, options: resources[permissionToResource(p.uuid) || ''] || [] }));
    }
  }, [isLoadingResources]);

  useEffect(() => {
    const resourceDefinitions = Object.entries(state).map(([permission, resourceState]) => ({ permission, resources: resourceState.selected }));
    input.onChange(resourceDefinitions);
    formOptions.change('resource-definitions', resourceDefinitions);
  }, [state]);

  const makeRow = ({ uuid: permission }: { uuid: string }) => {
    const options = state[permission]?.filteredOptions || [];
    return (
      <React.Fragment key={permission}>
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
            onToggle={() => {
              dispatchLocaly({ type: 'setFilter', key: permission, filtervalue: '' });
              onToggle(permission);
            }}
            onSelect={(event, selection) => {
              onSelect(event, selection as string, selection === intl.formatMessage(messages.selectAll, { length: options.length }), permission);
            }}
            onClear={() => clearSelection(permission)}
            selections={state[permission]?.selected || []}
            isOpen={state[permission]?.isOpen || false}
            onFilter={(e) => {
              if (e) {
                dispatchLocaly({ type: 'setFilter', key: permission, filtervalue: (e.target as HTMLInputElement).value });
              }
              return undefined;
            }}
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
