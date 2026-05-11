import React, { useEffect, useMemo, useReducer } from 'react';
import { Badge } from '@patternfly/react-core';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Chip } from '@patternfly/react-core/dist/dynamic/deprecated/components/Chip';
import { ChipGroup } from '@patternfly/react-core/dist/dynamic/deprecated/components/Chip';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Grid } from '@patternfly/react-core';
import { GridItem } from '@patternfly/react-core';
import { MenuToggle } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { Select } from '@patternfly/react-core';
import { SelectList } from '@patternfly/react-core';
import { SelectOption } from '@patternfly/react-core';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { TextInputGroup } from '@patternfly/react-core';
import { TextInputGroupMain } from '@patternfly/react-core';
import { TextInputGroupUtilities } from '@patternfly/react-core';
import { ContentVariants } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';
import TimesIcon from '@patternfly/react-icons/dist/js/icons/times-icon';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { FormattedMessage, useIntl } from 'react-intl';
import { useFlag } from '@unleash/proxy-client-react';
import { useInventoryGroupsQuery } from '../../../../shared/data/queries/inventory';
import messages from '../../../../Messages';

const MAX_DISPLAYED_OPTIONS = 50;

interface ResourceItem {
  id: string | null;
  name: string;
  className?: string;
}

interface PermissionState {
  selected: ResourceItem[];
  filterValue: string;
  isOpen: boolean;
}

type State = Record<string, PermissionState>;

type Action =
  | { type: 'toggle'; key: string; isOpen: boolean; filterValue?: string }
  | { type: 'select'; key: string; processedSelection: ResourceItem | undefined }
  | { type: 'selectAll'; key: string; selectionArray: ResourceItem[] }
  | { type: 'copyToAll'; permissions: string[] }
  | { type: 'setFilter'; key: string; filterValue: string }
  | { type: 'clear'; key: string };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'toggle': {
      const prevState = state[action.key];
      return {
        ...state,
        [action.key]: {
          ...prevState,
          isOpen: action.isOpen,
          filterValue: action.filterValue ?? prevState?.filterValue ?? '',
        },
      };
    }
    case 'select': {
      const prevState = state[action.key];
      if (!prevState) return state;
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
    }
    case 'copyToAll': {
      const firstPermissionSelection = state[action.permissions[0]]?.selected || [];
      return {
        ...state,
        ...action.permissions.reduce((acc: State, permission) => {
          acc[permission] = {
            ...state[permission],
            selected: !permission.includes('inventory:hosts') ? firstPermissionSelection.filter(({ id }) => id !== null) : firstPermissionSelection,
          };
          return acc;
        }, {}),
      };
    }
    case 'selectAll': {
      const prevState = state[action.key];
      return {
        ...state,
        [action.key]: {
          ...prevState,
          selected: action.selectionArray,
        },
      };
    }
    case 'setFilter': {
      const prevState = state[action.key];
      return {
        ...state,
        [action.key]: {
          ...prevState,
          filterValue: action.filterValue,
        },
      };
    }
    case 'clear': {
      const prevState = state[action.key];
      return {
        ...state,
        [action.key]: {
          ...prevState,
          selected: [],
        },
      };
    }
    default:
      return state;
  }
};

interface InventoryGroupsRoleProps {
  name: string;
  [key: string]: unknown;
}

const InventoryGroupsRole: React.FC<InventoryGroupsRoleProps> = (props) => {
  const intl = useIntl();
  const { input } = useFieldApi(props);
  const formOptions = useFormApi();
  const isHosts = (permissionID: string) => permissionID.includes('hosts:');
  const enableWorkspacesNameChange = useFlag('platform.rbac.groups-to-workspaces-rename');

  const permissions =
    (formOptions.getState().values['add-permissions-table'] as { uuid: string }[])
      .filter(({ uuid }) => uuid.split(':')[0].includes('inventory'))
      .map(({ uuid }) => uuid) || [];

  // Fetch inventory groups (API max per_page is 100)
  const { data: inventoryGroupsData, isLoading } = useInventoryGroupsQuery({
    perPage: 100,
    page: 1,
  });

  // Flat list of all groups as ResourceItems
  const allGroups = useMemo<ResourceItem[]>(() => {
    if (!inventoryGroupsData?.data) return [];
    return inventoryGroupsData.data.filter((group) => group.name && group.id).map((group) => ({ id: group.id, name: group.name }));
  }, [inventoryGroupsData]);

  // Lookup map for resolving selections by name
  const groupsByName = useMemo<Record<string, ResourceItem>>(() => {
    const map: Record<string, ResourceItem> = {};
    for (const group of allGroups) {
      map[group.name] = group;
    }
    return map;
  }, [allGroups]);

  const getFilteredGroups = (permissionID: string): ResourceItem[] => {
    const filterValue = state[permissionID]?.filterValue?.toLowerCase().trim() ?? '';
    if (!filterValue) return allGroups;
    return allGroups.filter((g) => g.name.toLowerCase().includes(filterValue));
  };

  const onSelect = (_event: unknown, selection: string, selectAll: boolean, key: string) => {
    const ungroupedSystems = { id: null, name: 'null' };
    if (selectAll) {
      const filtered = getFilteredGroups(key);
      const displayed = filtered.slice(0, MAX_DISPLAYED_OPTIONS);
      dispatchLocally({
        type: 'selectAll',
        selectionArray: isHosts(key) ? [ungroupedSystems, ...displayed] : displayed,
        key,
      });
      return;
    }
    dispatchLocally({
      type: 'select',
      processedSelection: selection === 'null' ? ungroupedSystems : groupsByName[selection],
      key,
    });
  };
  const clearSelection = (key: string) => dispatchLocally({ type: 'clear', key });

  const [state, dispatchLocally] = useReducer(
    reducer,
    permissions.reduce(
      (acc, permission) => ({
        ...acc,
        [permission]: {
          selected: [],
          filterValue: '',
          isOpen: false,
        },
      }),
      {} as State,
    ),
  );

  useEffect(() => {
    formOptions.change('inventory-group-permissions', []);
  }, []);

  useEffect(() => {
    const groupsPermissionsDefinition = Object.entries(state).map(([permission, { selected }]) => ({ permission, groups: selected }));
    input.onChange(groupsPermissionsDefinition);
    formOptions.change('inventory-group-permissions', groupsPermissionsDefinition);
  }, [state]);

  const onToggleClick = (permissionID: string) => dispatchLocally({ type: 'toggle', key: permissionID, isOpen: !state[permissionID].isOpen });

  const onTextInputChange = (_event: unknown, value: string, permissionID: string) => {
    dispatchLocally({ type: 'setFilter', key: permissionID, filterValue: value });
  };

  const toggle = (toggleRef: React.Ref<HTMLButtonElement>, permissionID: string) => (
    <Tooltip content={<div>{intl.formatMessage(enableWorkspacesNameChange ? messages.workspacesTooltip : messages.inventoryGroupsTooltip)}</div>}>
      <MenuToggle
        variant="typeahead"
        aria-label={intl.formatMessage(enableWorkspacesNameChange ? messages.workspacesTypeAheadLabel : messages.inventoryGroupsTypeAheadLabel)}
        onClick={() => onToggleClick(permissionID)}
        innerRef={toggleRef as React.Ref<HTMLButtonElement>}
        isExpanded={state[permissionID]?.isOpen || false}
        isFullWidth
        data-ouia-component-id={`inventory-group-toggle-${permissionID}`}
      >
        <TextInputGroup isPlain>
          <TextInputGroupMain
            value={state[permissionID]?.filterValue || ''}
            onClick={() => state[permissionID]?.isOpen || onToggleClick(permissionID)}
            onChange={(e, value) => onTextInputChange(e, value, permissionID)}
            autoComplete="off"
            placeholder={intl.formatMessage(enableWorkspacesNameChange ? messages.selectWorkspaces : messages.selectGroups)}
            role="combobox"
            isExpanded={state[permissionID]?.isOpen || false}
          >
            {(state[permissionID]?.selected?.length || 0) > 0 ? (
              <ChipGroup aria-label="Current selections">
                <Chip
                  closeBtnAriaLabel="Clear all"
                  badge={<Badge isRead>{state[permissionID]?.selected?.length || 0}</Badge>}
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
            {(state[permissionID]?.filterValue?.length || 0) > 0 && (
              <Button
                icon={<TimesIcon aria-hidden />}
                variant="plain"
                aria-label="Clear input value"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onTextInputChange(e, '', permissionID);
                }}
              />
            )}
          </TextInputGroupUtilities>
        </TextInputGroup>
      </MenuToggle>
    </Tooltip>
  );

  const makeRow = (permissionID: string, index: number) => {
    const filtered = getFilteredGroups(permissionID);
    const options = filtered.slice(0, MAX_DISPLAYED_OPTIONS);
    const hasMore = filtered.length > MAX_DISPLAYED_OPTIONS;

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
              isOpen={state[permissionID]?.isOpen || false}
              selected={state[permissionID]?.selected || []}
              onSelect={(event, selection) => onSelect(event, selection as string, selection === 'select-all', permissionID)}
              onOpenChange={(isOpen) => dispatchLocally({ type: 'toggle', key: permissionID, isOpen })}
              toggle={(toggleRef) => toggle(toggleRef, permissionID)}
              isScrollable
              maxMenuHeight="300px"
              ouiaId={`inventory-group-select-${permissionID}`}
            >
              <SelectList>
                {isLoading ? (
                  <SelectOption isLoading value="loading">
                    <Spinner size="lg" />
                  </SelectOption>
                ) : (
                  <>
                    {options.length > 0 ? (
                      <SelectOption className="pf-v6-u-link-color" key={`${permissionID}-all`} value="select-all">
                        <FormattedMessage
                          {...messages.selectAll}
                          values={{
                            length: options.length + Number(isHosts(permissionID)),
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
                          isSelected={state[permissionID]?.selected?.some((item) => item.name === 'null') || false}
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
                        isSelected={state[permissionID]?.selected?.some((item) => item.name === option.name) || false}
                        className={option.className}
                        value={option.name}
                      >
                        {option.name}
                      </SelectOption>
                    ))}
                    {hasMore ? (
                      <SelectOption isDisabled value="hint" key={`${permissionID}-hint`}>
                        <FormattedMessage {...messages.typeToRefineResults} values={{ shown: MAX_DISPLAYED_OPTIONS, total: filtered.length }} />
                      </SelectOption>
                    ) : null}
                  </>
                )}
              </SelectList>
            </Select>
          </GridItem>
          <GridItem md={2}>
            {index <= 0 && permissions.length > 1 && (
              <Button key={`${permissionID}-copy`} variant="link" isInline onClick={() => dispatchLocally({ type: 'copyToAll', permissions })}>
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
        <Content component={ContentVariants.h4} className="pf-v6-u-mt-sm">
          {intl.formatMessage(messages.permissions)}
        </Content>
      </GridItem>
      <GridItem lg={9} md={6} className="rbac-m-hide-on-sm">
        <Content component={ContentVariants.h4} className="pf-v6-u-mt-sm">
          {intl.formatMessage(enableWorkspacesNameChange ? messages.workspacesDefinition : messages.groupDefinition)}
        </Content>
      </GridItem>
      {permissions.map(makeRow)}
    </Grid>
  );
};

export default InventoryGroupsRole;
