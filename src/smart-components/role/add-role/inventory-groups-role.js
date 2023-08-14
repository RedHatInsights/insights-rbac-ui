import React, { useEffect, useReducer } from 'react';
import { Select, SelectOption, SelectVariant, Grid, GridItem, Text, TextVariants, FormGroup, Tooltip } from '@patternfly/react-core';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { useIntl } from 'react-intl';
import { fetchInventoryGroups } from '../../../redux/actions/inventory-actions';
import { debouncedFetch } from '../../../helpers/shared/helpers';
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

  const { resourceTypes, totalCount, isLoading } = useSelector(selector, shallowEqual);
  const permissions =
    formOptions
      .getState()
      .values['add-permissions-table'].filter(({ uuid }) => uuid.split(':')[0].includes('inventory'))
      .map(({ uuid }) => uuid) || [];

  const fetchData = (permissions, apiProps) => dispatch(fetchInventoryGroups(permissions, apiProps));

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

  const makeRow = (permissionId) => {
    const options = Object.values(resourceTypes?.[permissionId] ?? {});
    return (
      <React.Fragment key={`${permissionId}`}>
        <GridItem md={4} sm={12}>
          <FormGroup label={permissionId} isRequired />
        </GridItem>
        <GridItem md={8} sm={12}>
          <Tooltip content={<div>{intl.formatMessage(messages.inventoryGroupsTooltip)}</div>}>
            <Select
              className="rbac-m-resource-type-select"
              variant={SelectVariant.checkbox}
              typeAheadAriaLabel={intl.formatMessage(messages.inventoryGroupsTypeAheadLabel)}
              aria-labelledby={permissionId}
              selections={state[permissionId].selected.map(({ name }) => name)}
              placeholderText={intl.formatMessage(messages.selectGroups)}
              onSelect={(event, selection) =>
                onSelect(event, selection, selection === intl.formatMessage(messages.selectAll, { length: options?.length ?? 0 }), permissionId)
              }
              onToggle={(isOpen) => {
                // TODO: persist filter state when https://github.com/patternfly/patternfly-react/issues/9490 is resolved
                !isOpen && state[permissionId].filterValue?.length > 0 && fetchData([permissionId]);
                dispatchLocally({ type: 'toggle', key: permissionId, filterValue: '', page: 1, isOpen });
              }}
              onClear={() => clearSelection(permissionId)}
              onFilter={(event) => {
                if (event) {
                  dispatchLocally({ type: 'setFilter', key: permissionId, filterValue: event.target.value });
                  debouncedFetch(() => fetchData([permissionId], { name: state[permissionId].filterValue }), 2000);
                }
              }}
              isOpen={state[permissionId].isOpen}
              hasInlineFilter
              {...(!isLoading &&
                resourceTypes[permissionId] &&
                Object.values(resourceTypes[permissionId]).length < totalCount && {
                  loadingVariant: {
                    text: intl.formatMessage(messages.seeMore),
                    onClick: () => {
                      fetchData([permissionId], { page: state[permissionId].page + 1, name: state[permissionId].filterValue });
                      dispatchLocally({ type: 'setPage', key: permissionId, page: state[permissionId].page++ });
                    },
                  },
                })}
              {...(isLoading && { loadingVariant: 'spinner' })}
            >
              {[
                ...(options?.length > 0
                  ? [<SelectOption key={`${permissionId}-all`} value={intl.formatMessage(messages.selectAll, { length: options?.length })} />]
                  : []),
                ...(options?.map((option, index) => <SelectOption key={`${permissionId}-${index + 1}`} value={option?.name} />) || []),
              ]}
            </Select>
          </Tooltip>
        </GridItem>
      </React.Fragment>
    );
  };

  return (
    <Grid className="pf-u-mt-md" hasGutter>
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
      {permissions?.map(makeRow)}
    </Grid>
  );
};

export default InventoryGroupsRole;
