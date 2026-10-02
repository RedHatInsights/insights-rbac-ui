import React, { useState } from 'react';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Popover } from '@patternfly/react-core/dist/dynamic/components/Popover';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { Chip, ChipGroup } from '@patternfly/react-core/deprecated';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import QuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/outlined-question-circle-icon';
import { useIntl } from 'react-intl';
import { commonMessages } from '../../../../shared/messages/common';

interface Permission {
  uuid: string;
  requires?: string[];
}

interface AddPermissionTemplateProps {
  formFields: React.ReactNode[][];
}

const AddPermissionTemplate: React.FC<AddPermissionTemplateProps> = ({ formFields }) => {
  const formOptions = useFormApi();
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(formOptions.getState().values['add-permissions-table'] ?? []);
  const [alertClosed, setAlertClosed] = useState(false);
  const notAllowedBasePermissions = formOptions.getState().values['not-allowed-permissions'] as string[] | undefined;
  const intl = useIntl();

  const unresolvedSplats =
    (formOptions.getState().values?.['copy-base-role'] as { applications?: string[] })?.applications?.filter(
      (app) => !selectedPermissions?.find(({ uuid }) => uuid.includes(app)),
    ) ?? [];

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
          <ChipGroup
            categoryName={intl.formatMessage({
              id: 'selectedPermissions',
              defaultMessage: 'Selected permissions',
              description: 'Selected permissions label',
            })}
          >
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
          {intl.formatMessage(commonMessages.addPermissions)}
        </Title>
      </StackItem>
      <StackItem>
        <p>
          {intl.formatMessage({
            id: 'selectPermissionsForRole',
            defaultMessage: 'Select permissions to add to your role',
            description: 'Select permissions for role label',
          })}
          {unresolvedSplats.length !== 0 && (
            <Popover
              headerContent={intl.formatMessage({
                id: 'onlyGranularPermissions',
                defaultMessage: 'Custom roles only support granular permissions',
                description: 'Only granular permissions message',
              })}
              bodyContent={intl.formatMessage({
                id: 'noWildcardPermissions',
                defaultMessage:
                  'Wildcard permissions (for example, approval:*:*) aren’t included in this table and can’t be added to your custom role.',
                description: 'No wildcard permissions message',
              })}
            >
              <Button icon={<QuestionCircleIcon />} variant="link">
                {intl.formatMessage({
                  id: 'whyNotSeeingAllPermissions',
                  defaultMessage: 'Why am I not seeing all of my permissions?',
                  description: 'Why am I not seeing all of my permissions message',
                })}
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
            title={`${intl.formatMessage({ id: 'followingPermissionsCannotBeAdded', defaultMessage: 'The following permissions can not be added to a custom role and were removed from the copied role:', description: 'Following permissions cannot be added message' })} ${notAllowedBasePermissions.join(', ')}`}
            actionClose={<AlertActionCloseButton onClose={() => setAlertClosed(true)} />}
          />
        </StackItem>
      )}
      <StackItem isFilled>{permissionsTable}</StackItem>
    </Stack>
  );
};

export default AddPermissionTemplate;
