import React, { useEffect, useReducer } from 'react';
import {
  Badge,
  Button,
  Chip,
  ChipGroup,
  Divider,
  FormGroup,
  Grid,
  GridItem,
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
  Spinner,
  Text,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  TextVariants,
  Tooltip,
} from '@patternfly/react-core';
import { TimesIcon } from '@patternfly/react-icons';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { FormattedMessage, useIntl } from 'react-intl';
import { fetchInventoryGroups } from '../../../redux/inventory/actions';
import { debouncedFetch } from '../../../helpers/dataUtilities';
import messages from '../../../Messages';
import './cost-resources.scss';
import { useFlag } from '@unleash/proxy-client-react';

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
  const isHosts = (permissionID) => permissionID.includes('hosts:');
  const enableWorkspacesNameChange = useFlag('platform.rbac.groups-to-workspaces-rename');

  const { resourceTypes, totalCount, isLoading } = useSelector(selector, shallowEqual);
  const permissions =
    formOptions
      .getState()
      .values['add-permissions-table'].filter(({ uuid }) => uuid.split(':')[0].includes('inventory'))
      .map(({ uuid }) => uuid) || [];

  const fetchData = (permissions, apiProps) => dispatch(fetchInventoryGroups(permissions, apiProps));

  const onSelect = (_event, selection, selectAll, key) => {
    const ungroupedSystems = { id: null, name: 'null' };
    return (
      (selectAll &&
        dispatchLocally({
          type: 'selectAll',
          selectionArray: isHosts(key) ? [ungroupedSystems, ...Object.values(resourceTypes[key])] : Object.values(resourceTypes[key]),
          key,
        })) ||
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
      {},
    ),
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

  const onToggleClick = (permissionID) => dispatchLocally({ type: 'toggle', key: permissionID, isOpen: !state[permissionID].isOpen });

  const onTextInputChange = (_event, value, permissionID) => {
    dispatchLocally({ type: 'setFilter', key: permissionID, filterValue: value });
    debouncedFetch(() => fetchData([permissionID], { name: value }), 2000);
  };

  const toggle = (toggleRef, permissionID) => (
    <Tooltip content={<div>{intl.formatMessage(enableWorkspacesNameChange ? messages.workspacesTooltip : messages.inventoryGroupsTooltip)}</div>}>
      <MenuToggle
        variant="typeahead"
        aria-label={intl.formatMessage(enableWorkspacesNameChange ? messages.workspacesTypeAheadLabel : messages.inventoryGroupsTypeAheadLabel)}
        onClick={() => onToggleClick(permissionID)}
        innerRef={toggleRef}
        isExpanded={state[permissionID].isOpen}
        isFullWidth
      >
        <TextInputGroup isPlain>
          <TextInputGroupMain
            value={state[permissionID].filterValue}
            onClick={() => state[permissionID].isOpen || onToggleClick(permissionID)}
            onChange={(e, value) => onTextInputChange(e, value, permissionID)}
            autoComplete="off"
            placeholder={intl.formatMessage(enableWorkspacesNameChange ? messages.selectWorkspaces : messages.selectGroups)}
            role="combobox"
            isExpanded={state[permissionID].isOpen}
          >
            {state[permissionID].selected.length > 0 ? (
              <ChipGroup aria-label="Current selections">
                <Chip
                  closeBtnAriaLabel="Clear all"
                  badge={<Badge isRead>{state[permissionID].selected.length}</Badge>}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    clearSelection(permissionID);
                  }}
                >
                  selected
                </Chip>
              </ChipGroup>
            ) : null}
          </TextInputGroupMain>

          <TextInputGroupUtilities>
            {state[permissionID].filterValue.length > 0 && (
              <Button
                variant="plain"
                aria-label="Clear input value"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onTextInputChange(e, '', permissionID);
                }}
              >
                <TimesIcon aria-hidden />
              </Button>
            )}
          </TextInputGroupUtilities>
        </TextInputGroup>
      </MenuToggle>
    </Tooltip>
  );

  const makeRow = (permissionID, index) => {
    const options = Object.values(resourceTypes?.[permissionID] ?? {});

    return (
      <React.Fragment key={permissionID}>
        <Grid>
          <GridItem md={3}>
            <FormGroup label={permissionID?.replace('inventory:', '')} isRequired />
          </GridItem>
          <GridItem md={7}>
            <Select
              role="menu"
              aria-labelledby={permissionID}
              className="rbac-c-resource-type-select"
              isOpen={state[permissionID].isOpen}
              selected={state[permissionID].selected}
              onSelect={(event, selection) => onSelect(event, selection, selection === 'select-all', permissionID)}
              onOpenChange={(isOpen) => dispatchLocally({ type: 'toggle', key: permissionID, isOpen })}
              toggle={(toggleRef) => toggle(toggleRef, permissionID)}
            >
              <SelectList>
                {options?.length > 0 ? (
                  <SelectOption className="pf-v5-u-link-color" key={`${permissionID}-all`} value="select-all">
                    <FormattedMessage
                      {...messages.selectAll}
                      values={{
                        length: options?.length + Number(isHosts(permissionID)),
                      }}
                    />
                  </SelectOption>
                ) : null}
                {isHosts(permissionID) ? (
                  <>
                    <SelectOption
                      key={`${permissionID}-ungrouped`}
                      value="null"
                      hasCheckbox
                      isSelected={state[permissionID].selected.some((item) => item.name === 'null')}
                    >
                      <FormattedMessage {...messages.ungroupedSystems} />
                    </SelectOption>
                    {options.length > 0 ? <Divider component="li" key={`${permissionID}-divider`} /> : null}
                  </>
                ) : null}
                {options.map((option) => (
                  <SelectOption
                    hasCheckbox
                    key={option.id}
                    isSelected={state[permissionID].selected.some((item) => item.name === option.name)}
                    className={option.className}
                    value={option.name}
                  >
                    {option.name}
                  </SelectOption>
                ))}
                {isLoading || (resourceTypes[permissionID] && Object.values(resourceTypes[permissionID]).length < totalCount) ? (
                  <SelectOption
                    {...(!isLoading && { isLoadButton: true })}
                    {...(isLoading && { isLoading: true })}
                    onClick={() => {
                      fetchData([permissionID], { page: state[permissionID].page + 1, name: state[permissionID].filterValue });
                      dispatchLocally({ type: 'setPage', key: permissionID, page: state[permissionID].page + 1 });
                    }}
                    value="loader"
                  >
                    {isLoading ? <Spinner size="lg" /> : intl.formatMessage(messages.seeMore)}
                  </SelectOption>
                ) : null}
              </SelectList>
            </Select>
          </GridItem>
          <GridItem md={2}>
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
      <GridItem md={3} className="rbac-m-hide-on-sm">
        <Text component={TextVariants.h4} className="rbac-bold-text pf-v5-u-mt-sm">
          {intl.formatMessage(messages.permissions)}
        </Text>
      </GridItem>
      <GridItem lg={9} md={6} className="rbac-m-hide-on-sm">
        <Text component={TextVariants.h4} className="rbac-bold-text pf-v5-u-mt-sm">
          {intl.formatMessage(enableWorkspacesNameChange ? messages.workspacesDefinition : messages.groupDefinition)}
        </Text>
      </GridItem>
      {permissions.map(makeRow)}
    </Grid>
  );
};

export default InventoryGroupsRole;
