import React, { useState } from 'react';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core';
import { Button } from '@patternfly/react-core';
import { Chip, ChipGroup } from '@patternfly/react-core/deprecated';
import { Popover } from '@patternfly/react-core';
import { Stack, StackItem, Title } from '@patternfly/react-core';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import QuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/outlined-question-circle-icon';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

interface Permission {
  uuid: string;
  requires?: string[];
}

interface AddPermissionTemplateProps {
  formFields: React.ReactNode[][];
}

const AddPermissionTemplate: React.FC<AddPermissionTemplateProps> = ({ formFields }) => {
  const formOptions = useFormApi();
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(formOptions.getState().values['add-permissions-table'] || []);
  const [alertClosed, setAlertClosed] = useState(false);
  const notAllowedBasePermissions = formOptions.getState().values['not-allowed-permissions'] as string[] | undefined;
  const intl = useIntl();

  const unresolvedSplats =
    (formOptions.getState().values?.['copy-base-role'] as { applications?: string[] })?.applications?.filter(
      (app) => !selectedPermissions?.find(({ uuid }) => uuid.includes(app)),
    ) || [];

  // Get the add-permissions-table form field and clone it with the selected permissions props
  const addPermissionsField = formFields?.[0]?.[0];
  const permissionsTable = React.isValidElement(addPermissionsField)
    ? React.cloneElement(addPermissionsField as React.ReactElement, {
        selectedPermissions,
        setSelectedPermissions,
      })
    : addPermissionsField;

  return (
    <Stack hasGutter>
      {selectedPermissions.length > 0 && (
        <StackItem>
          <ChipGroup categoryName={intl.formatMessage(messages.selectedPermissions)}>
            {/* immutable reverse */}
            {selectedPermissions
              .reduce((acc: Permission[], i) => [i, ...acc], [])
              .map(({ uuid }) => (
                <Chip key={uuid} onClick={() => setSelectedPermissions(selectedPermissions.filter((p) => p.uuid !== uuid))}>
                  {uuid}
                </Chip>
              ))}
          </ChipGroup>
        </StackItem>
      )}
      <StackItem>
        <Title headingLevel="h1" size="xl">
          {intl.formatMessage(messages.addPermissions)}
        </Title>
      </StackItem>
      <StackItem>
        <p>
          {intl.formatMessage(messages.selectPermissionsForRole)}
          {unresolvedSplats.length !== 0 && (
            <Popover
              headerContent={intl.formatMessage(messages.onlyGranularPermissions)}
              bodyContent={intl.formatMessage(messages.noWildcardPermissions)}
            >
              <Button icon={<QuestionCircleIcon />} variant="link">
                {intl.formatMessage(messages.whyNotSeeingAllPermissions)}
              </Button>
            </Popover>
          )}
        </p>
      </StackItem>
      {notAllowedBasePermissions && notAllowedBasePermissions.length > 0 && !alertClosed && (
        <StackItem>
          <Alert
            variant="custom"
            isInline
            title={`${intl.formatMessage(messages.followingPermissionsCannotBeAdded)} ${notAllowedBasePermissions.join(', ')}`}
            actionClose={<AlertActionCloseButton onClose={() => setAlertClosed(true)} />}
          />
        </StackItem>
      )}
      <StackItem isFilled>{permissionsTable}</StackItem>
    </Stack>
  );
};

export default AddPermissionTemplate;
