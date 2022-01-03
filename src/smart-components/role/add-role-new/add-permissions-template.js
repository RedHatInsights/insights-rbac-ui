import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Chip, ChipGroup, Text, TextContent, Title, Button, Popover, Alert, AlertActionCloseButton } from '@patternfly/react-core';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import QuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/outlined-question-circle-icon';
import './add-role-wizard.scss';

const AddPermissionTemplate = ({ formFields }) => {
  const formOptions = useFormApi();
  const [selectedPermissions, setSelectedPermissions] = useState(formOptions.getState().values['add-permissions-table'] || []);
  const [alertClosed, setAlertClosed] = useState(false);
  const notAllowedBasePermissions = formOptions.getState().values['not-allowed-permissions'];

  const unresolvedSplats =
    formOptions.getState().values?.['copy-base-role']?.applications?.filter((app) => !selectedPermissions?.find(({ uuid }) => uuid.includes(app))) ||
    [];
  const addPermissions = formFields[0][0];
  return (
    <div className="rbac">
      {selectedPermissions.length > 0 ? (
        <div className="rbac-c-selected-chips">
          <ChipGroup categoryName="Selected permissions">
            {/* immutable reverse */}
            {selectedPermissions
              .reduce((acc, i) => [i, ...acc], [])
              .map(({ uuid }) => (
                <Chip key={uuid} color="blue" isTruncated onClick={() => setSelectedPermissions(selectedPermissions.filter((p) => p.uuid !== uuid))}>
                  {uuid}
                </Chip>
              ))}
          </ChipGroup>
        </div>
      ) : null}
      <Title headingLevel="h1" size="xl" className="rbac-c-add-permission-title">
        Add permissions
      </Title>
      <TextContent>
        <Text>
          Select permissions to add to your role
          {unresolvedSplats.length !== 0 && (
            <Popover
              headerContent="Custom roles only support granular permissions"
              bodyContent="Wildcard permissions (for example, approval:*:*) aren’t included in this table and can’t be added to your custom role."
            >
              <Button variant="link">
                Why am I not seeing all of my permissions? <QuestionCircleIcon />
              </Button>
            </Popover>
          )}
        </Text>
      </TextContent>
      {notAllowedBasePermissions?.length > 0 && !alertClosed ? (
        <Alert
          variant="default"
          isInline
          title={`The following permissions can not be added to a custom role and were removed from the copied role: ${notAllowedBasePermissions.join(
            ', '
          )}`}
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

AddPermissionTemplate.propTypes = {
  formFields: PropTypes.array,
};

export default AddPermissionTemplate;
