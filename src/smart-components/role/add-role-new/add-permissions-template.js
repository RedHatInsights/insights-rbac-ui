import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Chip, ChipGroup, Text, TextContent, Title, Button, Popover } from '@patternfly/react-core';
import useFormApi from '@data-driven-forms/react-form-renderer/dist/esm/use-form-api';
import QuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/outlined-question-circle-icon';
import './add-role-wizard.scss';

const AddPermissionTemplate = ({ formFields }) => {
  const formOptions = useFormApi();
  const [selectedPermissions, setSelectedPermissions] = useState(formOptions.getState().values['add-permissions-table'] || []);

  const unresolvedSplats =
    formOptions.getState().values?.['copy-base-role']?.applications?.filter((app) => !selectedPermissions?.find(({ uuid }) => uuid.includes(app))) ||
    [];
  const addPermissions = formFields[0][0];
  return (
    <React.Fragment>
      {selectedPermissions.length > 0 ? (
        <div className="ins-c-rbac-seleted-chips">
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
      <Title headingLevel="h1" size="xl" className="ins-c-rbac-add-permission-title">
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
    </React.Fragment>
  );
};

AddPermissionTemplate.propTypes = {
  formFields: PropTypes.array,
};

export default AddPermissionTemplate;
