import React, { useEffect, useReducer } from 'react';
import { Button, Select, SelectOption, SelectVariant, Grid, GridItem, Text, TextVariants, FormGroup, Tooltip } from '@patternfly/react-core';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { useIntl } from 'react-intl';
import { fetchInventoryGroups } from '../../../redux/actions/inventory-actions';
import messages from '../../../Messages';
import './cost-resources.scss';

const selector = ({ inventoryReducer: { resourceTypes, total, isLoading } }) => ({
  resourceTypes,
  totalCount: total,
  isLoading,
});

const reducer = (state, action) => {
  const prevState = state[action.key];
  switch (action.type) {
    case 'toggle':
      return {
        ...state,
        [action.key]: {
          ...prevState,
          isOpen: action.isOpen,
          filterValue: action.filterValue ?? prevState.filterValue,
          page: action.page ?? prevState.page,
        },
      };
    case 'select':
      if (prevState.selected.some((item) => item?.id === action.processedSelection?.id)) {
        return {
          ...state,
          [action.key]: {
            ...prevState,
            selected: prevState.selected.filter((item) => item.id !== action.processedSelection?.id),
          },
        };
      } else if (action.processedSelection?.id !== undefined && action.processedSelection?.name !== undefined) {
        return {
          ...state,
          [action.key]: {
            ...prevState,
            selected: [...prevState.selected, action.processedSelection],
          },
        };
      } else {
        return state;
      }
    case 'copyToAll': {
      const firstPermissionSelection = state[action.permissions[0]].selected;
      return {
        ...state,
        ...action.permissions.reduce((acc, permission) => {
          acc[permission] = {
            ...state[permission],
            selected: firstPermissionSelection,
          };
          return acc;
        }, {}),
      };
    }
    case 'selectAll':
      return {
        ...state,
        [action.key]: {
          ...prevState,
          selected: action.selectionArray,
        },
      };
    case 'setFilter':
      return {
        ...state,
        [action.key]: {
          ...prevState,
          filterValue: action.filterValue,
          page: 1,
        },
      };
    case 'setPage':
      return {
        ...state,
        [action.key]: {
          ...prevState,
          page: action.page,
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

const InventoryGroupsRole = (props) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const { input } = useFieldApi(props);
  const formOptions = useFormApi();

  // eslint-disable-next-line
  const { resourceTypes, totalCount, isLoading } = useSelector(selector, shallowEqual);
  const permissions =
    formOptions
      .getState()
      .values['add-permissions-table'].filter(({ uuid }) => uuid.split(':')[0].includes('inventory'))
      .map(({ uuid }) => uuid) || [];

  const fetchData = (permissions, apiProps) => dispatch(fetchInventoryGroups(permissions, apiProps));

  // eslint-disable-next-line
  const onSelect = (event, selection, selectAll, key) =>
    (selectAll && dispatchLocally({ type: 'selectAll', selectionArray: Object.values(resourceTypes[key]), key })) ||
    dispatchLocally({ type: 'select', processedSelection: resourceTypes[key][selection], key });
  const clearSelection = (key) => dispatchLocally({ type: 'clear', key });

  const [state, dispatchLocally] = useReducer(
    reducer,
    permissions.reduce(
      (acc, permission) => ({
        ...acc,
        [permission]: {
          page: 1,
          selected: [],
          filterValue: '',
          isOpen: false,
        },
      }),
      {}
    )
  );

  useEffect(() => {
    fetchData(permissions, {});
    formOptions.change('inventory-group-permissions', []);
  }, []);

  useEffect(() => {
    const groupsPermissionsDefinition = Object.entries(state).map(([permission, { selected }]) => ({ permission, groups: selected }));
    input.onChange(groupsPermissionsDefinition);
    formOptions.change('inventory-group-permissions', groupsPermissionsDefinition);
  }, [state]);

  const makeRow = (permission, index) => {
    const options = Object.values(resourceTypes?.[permission] ?? {});
    console.log('Current Permission:', permission);
    console.log('Current State:', state);

    return (
      <React.Fragment key={`${permission}`}>
        <Grid hasGutter>
          <GridItem lg={3} md={4} sm={2}>
            <FormGroup label={permission?.replace('inventory:', '')} isRequired />
          </GridItem>
          <GridItem lg={7} md={4} sm={8}>
            <Tooltip content={<div>{intl.formatMessage(messages.inventoryGroupsTooltip)}</div>}>
              <Select
                className="rbac-m-cost-resource-select"
                variant={SelectVariant.checkbox}
                typeAheadAriaLabel={intl.formatMessage(messages.inventoryGroupsTypeAheadLabel)}
                aria-labelledby={permission}
                selections={state[permission].selected.map(({ name }) => name)}
                placeholderText={intl.formatMessage(messages.selectGroups)}
                onSelect={(event, selection) =>
                  onSelect(event, selection, selection === intl.formatMessage(messages.selectAll, { length: options?.length ?? 0 }), permission)
                }
                onToggle={(isOpen) => {
                  !isOpen && state[permission].filterValue?.length > 0 && fetchData([permission]);
                  dispatchLocally({ type: 'toggle', key: permission, filterValue: '', page: 1, isOpen });
                }}
                onClear={() => clearSelection(permission)}
                onFilter={(e) => e && dispatchLocally({ type: 'setFilter', key: permission, filterValue: e.target.value })}
                isOpen={state[permission].isOpen}
                hasInlineFilter
              >
                {[
                  ...(options?.length > 0
                    ? [<SelectOption key={`${permission}-all`} value={intl.formatMessage(messages.selectAll, { length: options?.length })} />]
                    : []),
                  ...(options?.map((option, index) => <SelectOption key={`${permission}-${index + 1}`} value={option?.name} />) || []),
                ]}
              </Select>
            </Tooltip>
          </GridItem>
          <GridItem lg={2} md={4} sm={2} className="rbac-m-hide-on-sm">
            {index <= 0 && (
              <Button key={index} variant="link" isInLink onClick={() => dispatchLocally({ type: 'copyToAll', permissions })}>
                Copy to all
              </Button>
            )}
          </GridItem>
        </Grid>
      </React.Fragment>
    );
  };

  console.log('Current Permissions:', permissions);

  return (
    <Grid hasGutter>
      <GridItem lg={3} md={6} className="rbac-m-hide-on-sm">
        <Text component={TextVariants.h4} className="rbac-bold-text pf-u-mt-sm">
          {intl.formatMessage(messages.permissions)}
        </Text>
      </GridItem>
      <GridItem lg={9} md={6} className="rbac-m-hide-on-sm">
        <Text component={TextVariants.h4} className="rbac-bold-text pf-u-mt-sm">
          {intl.formatMessage(messages.groupDefinition)}
        </Text>
      </GridItem>
      {permissions.map(makeRow)}
    </Grid>
  );
};

export default InventoryGroupsRole;
