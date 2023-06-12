import React, { useContext } from 'react';
import { Title, Button, EmptyState, EmptyStateVariant, EmptyStateIcon, EmptyStateBody, EmptyStateSecondaryActions } from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons';
import { AddRoleWizardContext } from './add-role-wizard';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import messages from '../../../Messages';
import AppLink from '../../../presentational-components/shared/AppLink';
import pathnames from '../../../utilities/pathnames';

const AddRoleSuccess = ({ onClose }) => {
  const { setHideForm, setWizardSuccess } = useContext(AddRoleWizardContext);
  const intl = useIntl();
  return (
    <EmptyState variant={EmptyStateVariant.large}>
      <EmptyStateIcon color="green" icon={CheckCircleIcon} />
      <Title headingLevel="h4" size="lg">
        {intl.formatMessage(messages.roleCreatedSuccessfully)}
      </Title>
      <EmptyStateBody></EmptyStateBody>
      <Button onClick={onClose} variant="primary">
        {intl.formatMessage(messages.exit)}
      </Button>
      <EmptyStateSecondaryActions>
        <Button
          onClick={() => {
            setHideForm(false);
            setWizardSuccess(false);
          }}
          variant="link"
        >
          {intl.formatMessage(messages.createAnotherRole)}
        </Button>
        <Button component={(props) => <AppLink to={pathnames.groups.link} {...props} />} variant="link">
          {intl.formatMessage(messages.addRoleToGroup)}
        </Button>
      </EmptyStateSecondaryActions>
    </EmptyState>
  );
};

AddRoleSuccess.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default AddRoleSuccess;
