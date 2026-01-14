import React, { useEffect, useMemo, useReducer, useRef } from 'react';
import {
  Badge,
  Button,
  Content,
  ContentVariants,
  FormGroup,
  Grid,
  GridItem,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  Tooltip,
} from '@patternfly/react-core';
import { TimesIcon } from '@patternfly/react-icons';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { useIntl } from 'react-intl';
import { useQueries } from '@tanstack/react-query';
import { costKeys, getResource, useResourceTypesQuery } from '../../../data/queries/cost';
import messages from '../../../Messages';

interface ResourceType {
  value: string;
  path?: string;
}

interface Option {
  value: string;
}

interface PermissionState {
  selected: string[];
  options: Option[];
  filteredOptions: Option[];
  isOpen: boolean;
  filterValue: string;
}

type State = Record<string, PermissionState>;

type Action =
  | { type: 'toggle'; key: string; isOpen?: boolean }
  | { type: 'select'; selection: string; key: string }
  | { type: 'selectAll'; selection: string; key: string }
  | { type: 'clear'; key: string }
  | { type: 'setOptions'; key: string; options: Option[] }
  | { type: 'setFilter'; key: string; filtervalue: string };

const reducer = (state: State, action: Action): State => {
  const prevState = state[action.key];
  switch (action.type) {
    case 'toggle':
      return {
        ...state,
        [action.key]: {
          ...prevState,
          isOpen: action.isOpen !== undefined ? action.isOpen : !prevState.isOpen,
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
          filterValue: '',
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
          filterValue: action.filtervalue,
          filteredOptions: prevState.options.filter(({ value }) => value.toLowerCase().includes(action.filtervalue.toLowerCase())),
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
  const { input } = useFieldApi(props);
  const formOptions = useFormApi();
  const permissions = (formOptions.getState().values['add-permissions-table'] as { uuid: string }[]).filter(({ uuid }) =>
    uuid.split(':')[0].includes('cost-management'),
  );

  // TanStack Query - fetch resource types
  const { data: resourceTypesData, isLoading } = useResourceTypesQuery();

  const resourceTypes = useMemo(() => (resourceTypesData?.data || []) as ResourceType[], [resourceTypesData]);

  // Get unique resource paths needed for permissions
  const resourcePaths = useMemo(() => {
    if (isLoading) return [];
    return [
      ...new Set(permissions.map((permission) => resourceTypes.find((r) => r.value === permission.uuid.split(':')?.[1])?.path?.split('/')?.[5])),
    ].filter((path): path is string => Boolean(path));
  }, [permissions, resourceTypes, isLoading]);

  // Fetch resources for all unique paths in parallel using useQueries
  const resourceQueries = useQueries({
    queries: resourcePaths.map((path) => ({
      queryKey: costKeys.resourceDetail({ path }),
      queryFn: () => getResource({ path }),
      enabled: !!path,
    })),
  });

  // Process query results into a map of path -> resources
  const fetchedResources = useMemo(() => {
    const resources: Record<string, Option[]> = {};
    resourceQueries.forEach((query, index) => {
      const path = resourcePaths[index];
      if (path && query.data?.data) {
        resources[path] = query.data.data as Option[];
      }
    });
    return resources;
  }, [resourceQueries, resourcePaths]);

  const isLoadingResources = resourceQueries.some((q) => q.isLoading);

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
          filterValue: '',
        },
      }),
      {} as State,
    ),
  );

  const onToggle = (key: string, isOpen?: boolean) => dispatchLocaly({ type: 'toggle', key, isOpen });
  const clearSelection = (key: string) => dispatchLocaly({ type: 'clear', key });
  const onSelect = (selection: string, selectAll: boolean, key: string) =>
    selectAll ? dispatchLocaly({ type: 'selectAll', selection, key }) : dispatchLocaly({ type: 'select', selection, key });

  const permissionToResource = (permission: string) => resourceTypes.find((r) => r.value === permission.split(':')?.[1])?.path?.split('/')?.[5];

  // Initialize form and load saved resource definitions
  useEffect(() => {
    ((formOptions.getState().values['resource-definitions'] as { permission: string; resources: string[] }[]) || []).map(
      ({ permission, resources: resourceList }) =>
        resourceList.map(
          (resource) =>
            permissions.find((item) => item?.uuid === permission) && dispatchLocaly({ type: 'select', selection: resource, key: permission }),
        ),
    );
    formOptions.change('has-cost-resources', true);
  }, []);

  // Update options when resources are loaded
  useEffect(() => {
    if (!isLoadingResources && Object.keys(fetchedResources).length > 0) {
      permissions.map((p) =>
        dispatchLocaly({ type: 'setOptions', key: p.uuid, options: fetchedResources[permissionToResource(p.uuid) || ''] || [] }),
      );
    }
  }, [fetchedResources, isLoadingResources]);

  // Sync state changes to form
  useEffect(() => {
    const resourceDefinitions = Object.entries(state).map(([permission, resourceState]) => ({ permission, resources: resourceState.selected }));
    input.onChange(resourceDefinitions);
    formOptions.change('resource-definitions', resourceDefinitions);
  }, [state]);

  const makeRow = ({ uuid: permission }: { uuid: string }) => {
    const options = state[permission]?.filteredOptions || [];
    const selected = state[permission]?.selected || [];
    const filterValue = state[permission]?.filterValue || '';
    const isOpen = state[permission]?.isOpen || false;
    const selectAllLabel = intl.formatMessage(messages.selectAll, { length: options.length });
    const textInputRef = useRef<HTMLInputElement>(null);

    const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
      <MenuToggle ref={toggleRef} variant="typeahead" onClick={() => onToggle(permission)} isExpanded={isOpen} isFullWidth>
        <TextInputGroup isPlain>
          <TextInputGroupMain
            value={filterValue}
            onClick={() => onToggle(permission, true)}
            onChange={(_event, value) => dispatchLocaly({ type: 'setFilter', key: permission, filtervalue: value })}
            autoComplete="off"
            innerRef={textInputRef}
            placeholder={intl.formatMessage(messages.selectResources)}
            aria-labelledby={permission}
          >
            {selected.length > 0 && <Badge isRead>{selected.length}</Badge>}
          </TextInputGroupMain>
          {selected.length > 0 && (
            <TextInputGroupUtilities>
              <Button variant="plain" onClick={() => clearSelection(permission)} aria-label="Clear input value">
                <TimesIcon aria-hidden />
              </Button>
            </TextInputGroupUtilities>
          )}
        </TextInputGroup>
      </MenuToggle>
    );

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
            isOpen={isOpen}
            onSelect={(_event, value) => {
              if (value === selectAllLabel) {
                onSelect(value as string, true, permission);
              } else {
                onSelect(value as string, false, permission);
              }
            }}
            onOpenChange={(isOpen) => onToggle(permission, isOpen)}
            toggle={toggle}
          >
            <SelectList>
              <SelectOption hasCheckbox value={selectAllLabel} isSelected={selected.length === options.length && options.length > 0}>
                {selectAllLabel}
              </SelectOption>
              {options.map((option) => (
                <SelectOption key={option.value} hasCheckbox value={option.value} isSelected={selected.includes(option.value)}>
                  {option.value}
                </SelectOption>
              ))}
            </SelectList>
          </Select>
        </GridItem>
      </React.Fragment>
    );
  };

  return (
    <Grid hasGutter>
      <GridItem md={4} className="rbac-m-hide-on-sm">
        <Content component={ContentVariants.h4} className="pf-v6-u-font-weight-bold">
          {intl.formatMessage(messages.permissions)}
        </Content>
      </GridItem>
      <GridItem md={8} className="rbac-m-hide-on-sm">
        <Content component={ContentVariants.h4} className="pf-v6-u-font-weight-bold">
          {intl.formatMessage(messages.resourceDefinitions)}
        </Content>
      </GridItem>
      {permissions.map(makeRow)}
    </Grid>
  );
};

export default CostResources;
