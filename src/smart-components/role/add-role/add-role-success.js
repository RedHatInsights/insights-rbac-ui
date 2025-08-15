import React, { useContext } from 'react';
import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateVariant,
} from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import messages from '../../../Messages';
import AppLink from '../../../presentational-components/shared/AppLink';
import pathnames from '../../../utilities/pathnames';
import { AddRoleWizardContext } from './add-role-wizard-context';

const AddRoleSuccess = ({ onClose }) => {
  const { setHideForm, setWizardSuccess } = useContext(AddRoleWizardContext);
  const intl = useIntl();
  return (
    <EmptyState variant={EmptyStateVariant.lg}>
      <EmptyStateHeader
        titleText={<>{intl.formatMessage(messages.roleCreatedSuccessfully)}</>}
        icon={<EmptyStateIcon color="green" icon={CheckCircleIcon} />}
        headingLevel="h4"
      />
      <EmptyStateBody></EmptyStateBody>
      <EmptyStateFooter>
        <Button onClick={onClose} variant="primary">
          {intl.formatMessage(messages.exit)}
        </Button>
        <EmptyStateActions>
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
        </EmptyStateActions>
      </EmptyStateFooter>
    </EmptyState>
  );
};

AddRoleSuccess.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default AddRoleSuccess;
