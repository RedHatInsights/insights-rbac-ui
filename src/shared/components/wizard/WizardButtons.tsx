/**
 * Custom wizard buttons component for data-driven-forms
 *
 * PatternFly 6 expects WizardFooter to use ActionList with ActionListGroup
 * for proper button layout. This component provides that structure.
 */
import React from 'react';
import { ActionList, ActionListGroup, ActionListItem, Button } from '@patternfly/react-core';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';

interface WizardButtonLabels {
  submit?: React.ReactNode;
  cancel?: React.ReactNode;
  back?: React.ReactNode;
  next?: React.ReactNode;
}

interface WizardButtonsProps {
  disableBack?: boolean;
  handlePrev: () => void;
  nextStep?: unknown;
  handleNext: (next: string) => void;
  buttonsClassName?: string;
  buttonLabels: WizardButtonLabels;
  renderNextButton: (args?: Record<string, unknown>) => React.ReactNode;
  selectNext: (nextStep: unknown, getState: () => unknown) => string;
}

/**
 * WizardButtons - Custom wizard footer buttons with proper PF6 ActionList layout
 *
 * Usage in wizard schema:
 * {
 *   name: 'step-name',
 *   title: 'Step Title',
 *   buttons: WizardButtons,
 *   fields: [...]
 * }
 */
const WizardButtons: React.FC<WizardButtonsProps> = ({ disableBack, handlePrev, buttonLabels, renderNextButton }) => {
  const { cancel, back } = buttonLabels;
  const formOptions = useFormApi();

  // Use ActionList with ActionListGroup for proper PF6 wizard footer layout
  // First group: Back + Next buttons
  // Second group: Cancel button (separated for proper spacing)
  return (
    <ActionList>
      <ActionListGroup>
        <ActionListItem>
          <Button type="button" variant="secondary" isDisabled={disableBack} onClick={handlePrev}>
            {back}
          </Button>
        </ActionListItem>
        <ActionListItem>{renderNextButton()}</ActionListItem>
      </ActionListGroup>
      <ActionListGroup>
        <ActionListItem>
          <Button type="button" variant="link" onClick={formOptions.onCancel}>
            {cancel}
          </Button>
        </ActionListItem>
      </ActionListGroup>
    </ActionList>
  );
};

export default WizardButtons;
