import React, { useEffect, useReducer, useRef } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
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
import { fetchResource, fetchResourceDefinitions } from '../../../redux/cost-management/actions';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';
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
