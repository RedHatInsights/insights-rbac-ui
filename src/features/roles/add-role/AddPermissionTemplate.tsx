import React, { useState } from 'react';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { AlertActionCloseButton } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Chip } from '@patternfly/react-core/dist/dynamic/components/Chip';
import { ChipGroup } from '@patternfly/react-core/dist/dynamic/components/Chip';
import { Popover } from '@patternfly/react-core/dist/dynamic/components/Popover';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import QuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/outlined-question-circle-icon';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';
import './add-role-wizard.scss';

interface Permission {
  uuid: string;
  requires?: string[];
}

interface FormField {
  props: Record<string, unknown>;
}

interface AddPermissionTemplateProps {
  formFields: FormField[][];
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
  const addPermissions = formFields[0][0];
  return (
    <div className="rbac">
      {selectedPermissions.length > 0 ? (
        <div className="rbac-c-selected-chips">
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
        </div>
      ) : null}
      <Title headingLevel="h1" size="xl" className="rbac-c-add-permission-title">
        {intl.formatMessage(messages.addPermissions)}
      </Title>
      <TextContent>
        <Text>
          {intl.formatMessage(messages.selectPermissionsForRole)}
          {unresolvedSplats.length !== 0 && (
            <Popover
              headerContent={intl.formatMessage(messages.onlyGranularPermissions)}
              bodyContent={intl.formatMessage(messages.noWildcardPermissions)}
            >
              <Button variant="link">
                {intl.formatMessage(messages.whyNotSeeingAllPermissions)} <QuestionCircleIcon />
              </Button>
            </Popover>
          )}
        </Text>
      </TextContent>
      {notAllowedBasePermissions && notAllowedBasePermissions.length > 0 && !alertClosed ? (
        <Alert
          variant="custom"
          isInline
          title={`${intl.formatMessage(messages.followingPermissionsCannotBeAdded)} ${notAllowedBasePermissions.join(', ')}`}
          actionClose={<AlertActionCloseButton onClose={() => setAlertClosed(true)} />}
        />
      ) : null}
      {[
        [
          {
            ...addPermissions,
            props: {
              ...addPermissions.props,
              selectedPermissions,
              setSelectedPermissions,
            },
          },
        ],
      ]}
    </div>
  );
};

export default AddPermissionTemplate;
