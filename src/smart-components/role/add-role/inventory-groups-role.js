import React, { useEffect, useReducer } from 'react';
import { Button, Grid, GridItem, Text, TextVariants, FormGroup, Tooltip, Divider } from '@patternfly/react-core';
import { Select, SelectOption, SelectVariant } from '@patternfly/react-core/deprecated';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { FormattedMessage, useIntl } from 'react-intl';
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
    case 'copyToAll': {
      const firstPermissionSelection = state[action.permissions[0]].selected;
      return {
        ...state,
        ...action.permissions.reduce((acc, permission) => {
          acc[permission] = {
            ...state[permission],
            selected: !permission.includes('inventory:hosts') ? firstPermissionSelection.filter(({ id }) => id !== null) : firstPermissionSelection,
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

  const { resourceTypes, totalCount, isLoading } = useSelector(selector, shallowEqual);
  const permissions =
    formOptions
      .getState()
      .values['add-permissions-table'].filter(({ uuid }) => uuid.split(':')[0].includes('inventory'))
      .map(({ uuid }) => uuid) || [];

  const fetchData = (permissions, apiProps) => dispatch(fetchInventoryGroups(permissions, apiProps));

  // eslint-disable-next-line
  const onSelect = (event, selection, selectAll, key) => {
    const ungroupedSystems = { id: null, name: 'null' };
    return (
      (selectAll && dispatchLocally({ type: 'selectAll', selectionArray: [ungroupedSystems, ...Object.values(resourceTypes[key])], key })) ||
      dispatchLocally({ type: 'select', processedSelection: selection === 'null' ? ungroupedSystems : resourceTypes[key][selection], key })
    );
  };
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

  const makeRow = (permissionID, index) => {
    const ungroupedSystems = intl
      .formatMessage(messages.ungroupedSystems)
      .toLocaleLowerCase()
      .includes(state[permissionID].filterValue.toLocaleLowerCase())
      ? [
          <SelectOption key={`${permissionID}-ungrouped`} value="null">
            <FormattedMessage {...messages.ungroupedSystems} />
          </SelectOption>,
          <Divider component="li" key={`${permissionID}-divider`} />,
        ]
      : [];
    const options = Object.values(resourceTypes?.[permissionID] ?? {});

    return (
      <React.Fragment key={permissionID}>
        <Grid>
          <GridItem lg={3} md={3} sm={4}>
            <FormGroup label={permissionID?.replace('inventory:', '')} isRequired />
          </GridItem>
          <GridItem lg={7} md={6} sm={5}>
            <Tooltip content={<div>{intl.formatMessage(messages.inventoryGroupsTooltip)}</div>}>
              <Select
                className="rbac-m-resource-type-select"
                variant={SelectVariant.checkbox}
                typeAheadAriaLabel={intl.formatMessage(messages.inventoryGroupsTypeAheadLabel)}
                aria-labelledby={permissionID}
                selections={state[permissionID].selected.map(({ name }) => name)}
                placeholderText={intl.formatMessage(messages.selectGroups)}
                onSelect={(event, selection) => onSelect(event, selection, selection === 'select-all', permissionID)}
                onToggle={(_event, isOpen) => {
                  // TODO: persist filter state when https://github.com/patternfly/patternfly-react/issues/9490 is resolved
                  !isOpen && state[permissionID].filterValue?.length > 0 && fetchData([permissionID]);
                  dispatchLocally({ type: 'toggle', key: permissionID, filterValue: '', page: 1, isOpen });
                }}
                onClear={() => clearSelection(permissionID)}
                onFilter={(event) => {
                  if (event) {
                    dispatchLocally({ type: 'setFilter', key: permissionID, filterValue: event.target.value });
                    debouncedFetch(() => fetchData([permissionID], { name: event.target.value }), 2000);
                  }
                }}
                isOpen={state[permissionID].isOpen}
                hasInlineFilter
                {...(!isLoading &&
                  resourceTypes[permissionID] &&
                  Object.values(resourceTypes[permissionID]).length < totalCount && {
                    loadingVariant: {
                      text: intl.formatMessage(messages.seeMore),
                      onClick: () => {
                        fetchData([permissionID], { page: state[permissionID].page + 1, name: state[permissionID].filterValue });
                        dispatchLocally({ type: 'setPage', key: permissionID, page: state[permissionID].page++ });
                      },
                    },
                  })}
                {...(isLoading && { loadingVariant: 'spinner' })}
              >
                {[
                  ...(options?.length > 0
                    ? [
                        <SelectOption key={`${permissionID}-all`} value="select-all">
                          <FormattedMessage
                            {...messages.selectAll}
                            values={{
                              length: options?.length,
                            }}
                          />
                        </SelectOption>,
                      ]
                    : []),
                  ...(permissionID.includes('hosts:') ? ungroupedSystems : []),
                  ...(options?.map((option, index) => (
                    <SelectOption key={`${permissionID}-${index + 1}`} value={option?.name}>
                      {option.children}
                    </SelectOption>
                  )) || []),
                ]}
              </Select>
            </Tooltip>
          </GridItem>
          <GridItem lg={2} md={4} sm={2}>
            {index <= 0 && permissions.length > 1 && (
              <Button key={`${permissionID}-copy`} variant="link" isInLink onClick={() => dispatchLocally({ type: 'copyToAll', permissions })}>
                {intl.formatMessage(messages.copyToAll)}
              </Button>
            )}
          </GridItem>
        </Grid>
      </React.Fragment>
    );
  };

  return (
    <Grid hasGutter>
      <GridItem lg={3} md={6} className="rbac-m-hide-on-sm">
        <Text component={TextVariants.h4} className="rbac-bold-text pf-v5-u-mt-sm">
          {intl.formatMessage(messages.permissions)}
        </Text>
      </GridItem>
      <GridItem lg={9} md={6} className="rbac-m-hide-on-sm">
        <Text component={TextVariants.h4} className="rbac-bold-text pf-v5-u-mt-sm">
          {intl.formatMessage(messages.groupDefinition)}
        </Text>
      </GridItem>
      {permissions.map(makeRow)}
    </Grid>
  );
};

export default InventoryGroupsRole;
