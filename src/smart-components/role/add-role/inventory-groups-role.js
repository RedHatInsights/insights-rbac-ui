import React, { useEffect, useReducer } from 'react';
import { Select, SelectOption, SelectVariant, Grid, GridItem, Text, TextVariants, FormGroup, Tooltip } from '@patternfly/react-core';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { useIntl } from 'react-intl';
import { fetchInventoryGroups } from '../../../redux/actions/inventory-actions';
import './cost-resources.scss';
import messages from '../../../Messages';

const selector = ({ inventoryReducer: { resourceTypes } }) => ({
  resourceTypes: resourceTypes.data?.reduce((acc, curr) => ({ ...acc, [curr.name]: { ...curr } }), {}),
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

  const fetchData = (apiProps) => dispatch(fetchInventoryGroups(apiProps));
  const { resourceTypes } = useSelector(selector, shallowEqual);
  const permissions = formOptions.getState().values['add-permissions-table'].filter(({ uuid }) => uuid.split(':')[0].includes('inventory'));

  const onToggle = (key, isOpen) => dispatchLocally({ type: 'toggle', key, isOpen });
  const onSelect = (event, selection, selectAll, key) => {
    if (selectAll) {
      dispatchLocally({ type: 'selectAll', selectionArray: Object.values(resourceTypes), key });
    } else {
      dispatchLocally({ type: 'select', processedSelection: resourceTypes[selection], key });
    }
  };
  const clearSelection = (key) => dispatchLocally({ type: 'clear', key });

  const [state, dispatchLocally] = useReducer(
    reducer,
    permissions.reduce(
      (acc, permission) => ({
        ...acc,
        [permission.uuid]: {
          selected: [],
          filterValue: '',
          isOpen: false,
        },
      }),
      {}
    )
  );

  useEffect(() => {
    fetchData();
    formOptions.change('inventory-group-permissions', []);
  }, []);

  useEffect(() => {
    const groupsPermissionsDefinition = Object.entries(state).map(([permission, { selected }]) => ({ permission, groups: selected }));
    input.onChange(groupsPermissionsDefinition);
    formOptions.change('inventory-group-permissions', groupsPermissionsDefinition);
  }, [state]);

  const makeRow = ({ uuid: permission }) => {
    const options = Object.values(resourceTypes).filter((item) => item.name.includes(state[permission].filterValue));
    return (
      <React.Fragment key={`${permission}`}>
        <GridItem md={4} sm={12}>
          <FormGroup label={permission} isRequired />
        </GridItem>
        <GridItem md={8} sm={12}>
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
                dispatchLocally({ type: 'setFilter', key: permission, filterValue: '' });
                onToggle(permission, isOpen);
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
      </React.Fragment>
    );
  };

  return (
    <Grid hasGutter>
      <GridItem md={4} className="rbac-m-hide-on-sm">
        <Text component={TextVariants.h4} className="rbac-bold-text pf-u-mt-sm">
          {intl.formatMessage(messages.permissions)}
        </Text>
      </GridItem>
      <GridItem md={8} className="rbac-m-hide-on-sm">
        <Text component={TextVariants.h4} className="rbac-bold-text pf-u-mt-sm">
          {intl.formatMessage(messages.groupDefinition)}
        </Text>
      </GridItem>
      {permissions.map(makeRow)}
    </Grid>
  );
};

export default InventoryGroupsRole;
