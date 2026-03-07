import React, { useCallback, useMemo } from 'react';
import { DualListSelector } from '@patternfly/react-core/dist/dynamic/deprecated/components/DualListSelector';
import useFieldApi, { UseFieldApiConfig } from '@data-driven-forms/react-form-renderer/use-field-api';
import isEqual from 'lodash/isEqual';

// FormGroup from @data-driven-forms/pf4-component-mapper has broken TypeScript types
// (exports interface instead of component), so we import it with type assertion

const FormGroup = require('@data-driven-forms/pf4-component-mapper/form-group').default as React.FC<{
  label?: React.ReactNode;
  isRequired?: boolean;
  helperText?: React.ReactNode;
  meta?: unknown;
  validateOnMount?: boolean;
  description?: React.ReactNode;
  hideLabel?: boolean;
  id?: string;
  FormGroupProps?: unknown;
  children?: React.ReactNode;
}>;

interface FixedDualListSelectProps extends Omit<UseFieldApiConfig, 'name'> {
  name: string;
  label?: React.ReactNode;
  isRequired?: boolean;
  helperText?: React.ReactNode;
  description?: React.ReactNode;
  hideLabel?: boolean;
  id?: string;
  options: React.ReactNode[];
  getValueFromNode?: (option: React.ReactNode) => string;
  isSearchable?: boolean;
  leftTitle?: string;
  rightTitle?: string;
  filterOptionsTitle?: string;
  filterValueTitle?: string;
}

/**
 * Fixed DualListSelect component that works around the data-driven-forms bug
 * where addSelected/removeSelected callbacks have different signatures than onListChange.
 *
 * PatternFly DualListSelector callback signatures:
 * - onListChange(event, newAvailable, newChosen)
 * - addSelected(newAvailable, newChosen) - NO event!
 * - removeSelected(newAvailable, newChosen) - NO event!
 *
 * The data-driven-forms library passes the same handler to both, but expects
 * (event, available, chosen) signature, causing chosen to be undefined for addSelected.
 *
 * This component provides separate handlers with correct parameter positions.
 */
const FixedDualListSelect: React.FC<FixedDualListSelectProps> = (props) => {
  const {
    label,
    isRequired,
    helperText,
    meta,
    validateOnMount,
    description,
    hideLabel,
    id,
    input,
    FormGroupProps,
    options,
    getValueFromNode,
    isSearchable,
    leftTitle,
    rightTitle,
    filterOptionsTitle,
    filterValueTitle,
  } = useFieldApi({
    ...props,
    FieldProps: {
      isEqual: (current: unknown[], initial: unknown[]) => isEqual([...(current || [])].sort(), [...(initial || [])].sort()),
    },
  });

  const value: string[] = input.value || [];

  // Helper to extract text content from a ReactNode for string operations (filtering, mapping)
  const getTextFromNode = useCallback((node: React.ReactNode): string => {
    if (node === null || node === undefined) {
      return '';
    }
    if (typeof node === 'string' || typeof node === 'number') {
      return String(node);
    }
    if (React.isValidElement(node)) {
      // For JSX elements, recursively extract text from children
      const children = node.props.children;
      if (Array.isArray(children)) {
        return children.map((child) => getTextFromNode(child)).join('');
      }
      return getTextFromNode(children);
    }
    if (Array.isArray(node)) {
      return node.map((child) => getTextFromNode(child)).join('');
    }
    return '';
  }, []);

  // Helper to get display label from option (matches data-driven-forms behavior)
  const getOptionLabel = useCallback((option: React.ReactNode): React.ReactNode => {
    // For object options with label property (standard format)
    if (typeof option === 'object' && option !== null && 'label' in option) {
      return (option as { label: React.ReactNode }).label;
    }
    // For JSX elements, the label is in props.children
    if (React.isValidElement(option)) {
      return option.props.children;
    }
    return option;
  }, []);

  // Helper to get value from option
  const getOptionValue = useCallback(
    (option: React.ReactNode): string => {
      if (getValueFromNode) {
        return getValueFromNode(option);
      }
      if (typeof option === 'object' && option !== null && 'value' in option) {
        return String((option as { value: unknown }).value);
      }
      return String(option);
    },
    [getValueFromNode],
  );

  // Build available and chosen options based on CURRENT form value
  // This makes the component fully controlled
  // Important: We map options to their LABELS for display, but track VALUES internally
  const { availableOptions, chosenOptions } = useMemo(() => {
    const available: React.ReactNode[] = [];
    const chosen: React.ReactNode[] = [];

    options.forEach((option: React.ReactNode) => {
      const optionValue = getOptionValue(option);
      const optionLabel = getOptionLabel(option);
      if (value.includes(optionValue)) {
        chosen.push(optionLabel);
      } else {
        available.push(optionLabel);
      }
    });

    return { availableOptions: available, chosenOptions: chosen };
  }, [options, getOptionValue, getOptionLabel, value]);

  // Build a map from label text to value for reverse lookup
  // Uses getTextFromNode to properly extract text from ReactNode labels
  const labelToValueMap = useMemo(() => {
    const map = new Map<string, string>();
    options.forEach((option: React.ReactNode) => {
      const optionValue = getOptionValue(option);
      const optionLabel = getOptionLabel(option);
      const labelText = getTextFromNode(optionLabel);
      map.set(labelText, optionValue);
    });
    return map;
  }, [options, getOptionValue, getOptionLabel, getTextFromNode]);

  // Extract values from chosen options array (which contains labels as ReactNodes)
  const extractValuesFromOptions = useCallback(
    (chosenOpts: React.ReactNode[]): string[] => {
      return chosenOpts.map((opt) => {
        const labelText = getTextFromNode(opt);
        // Look up the value from our label-to-value map
        return labelToValueMap.get(labelText) || labelText;
      });
    },
    [labelToValueMap, getTextFromNode],
  );

  // Handler for onListChange: (event, newAvailable, newChosen)
  const handleListChange = useCallback(
    (_event: React.MouseEvent<HTMLElement>, _newAvailable: React.ReactNode[], newChosen: React.ReactNode[]) => {
      const newValues = extractValuesFromOptions(newChosen);
      // Use input.onChange to properly trigger validation (matches data-driven-forms behavior)
      input.onChange(newValues);
    },
    [extractValuesFromOptions, input],
  );

  // Handler for addSelected/removeSelected/addAll/removeAll: (newAvailable, newChosen) - NO EVENT
  // These have different signature than onListChange - this is the fix for the data-driven-forms bug
  const handleSelectionChange = useCallback(
    (_newAvailable: React.ReactNode[], newChosen: React.ReactNode[]) => {
      const newValues = extractValuesFromOptions(newChosen);
      // Use input.onChange to properly trigger validation (matches data-driven-forms behavior)
      input.onChange(newValues);
    },
    [extractValuesFromOptions, input],
  );

  // Filter function for search (works on labels which are what's displayed)
  // Uses getTextFromNode to properly extract text from ReactNode labels for filtering
  const filterOption = useCallback(
    (option: React.ReactNode, filterValue: string) => {
      const optLabel = getTextFromNode(option);
      return optLabel.toLowerCase().includes(filterValue.toLowerCase());
    },
    [getTextFromNode],
  );

  return (
    <FormGroup
      label={label}
      isRequired={isRequired}
      helperText={helperText}
      meta={meta}
      validateOnMount={validateOnMount}
      description={description}
      hideLabel={hideLabel}
      id={id || input.name}
      FormGroupProps={FormGroupProps}
    >
      <DualListSelector
        availableOptions={availableOptions}
        chosenOptions={chosenOptions}
        onListChange={handleListChange}
        addAll={handleSelectionChange}
        addSelected={handleSelectionChange}
        removeAll={handleSelectionChange}
        removeSelected={handleSelectionChange}
        filterOption={filterOption}
        id={id || input.name}
        isSearchable={isSearchable}
        availableOptionsTitle={leftTitle}
        chosenOptionsTitle={rightTitle}
        availableOptionsSearchAriaLabel={filterOptionsTitle}
        chosenOptionsSearchAriaLabel={filterValueTitle}
      />
    </FormGroup>
  );
};

export default FixedDualListSelect;
