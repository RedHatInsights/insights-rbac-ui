import React, { useContext, useEffect } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import {
  Bullseye,
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateVariant,
  Progress,
  Spinner,
  Title,
} from '@patternfly/react-core';
import { InProgressIcon } from '@patternfly/react-icons';
import { AddGroupWizardContext } from './add-group-wizard';
import { asyncValidator } from '../validators';
import useAppNavigate from '../../../hooks/useAppNavigate';
import WizardError from '../../common/wizard-error';
import pathnames from '../../../utilities/pathnames';
import messages from '../../../Messages';
import './review-step.scss';

const ReviewTemplate = ({ formFields }) => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const { submittingGroup, submittingServiceAccounts, error, setWizardError } = useContext(AddGroupWizardContext);
  const { getState } = useFormApi();
  useEffect(() => {
    setWizardError(undefined);
    asyncValidator(getState().values['group-name'])
      .then(() => setWizardError(false))
      .catch(() => setWizardError(true));
  }, []);

  if (typeof error === 'undefined' || (submittingGroup && !submittingServiceAccounts)) {
    return (
      <Bullseye>
        <Spinner className="pf-v5-u-mt-xl" size="xl" />
      </Bullseye>
    );
  }

  if (submittingServiceAccounts && !error) {
    return (
      <EmptyState variant={EmptyStateVariant.lg} data-component-ouia-id="wizard-progress" className="rbac-add-group-progress">
        <EmptyStateHeader
          titleText={intl.formatMessage(messages.groupBeingCreated)}
          icon={<EmptyStateIcon className="pf-v5-u-mt-xl" icon={InProgressIcon} />}
          headingLevel="h4"
        />
        <EmptyStateBody>
          <Progress
            min={0}
            max={2}
            value={submittingGroup ? 0 : submittingServiceAccounts ? 1 : 2}
            label={intl.formatMessage(submittingGroup ? messages.creatingGroup : messages.associatingServiceAccounts)}
          />
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return error ? (
    <WizardError
      context={AddGroupWizardContext}
      title={
        submittingGroup
          ? intl.formatMessage(messages.groupNameTakenTitle)
          : intl.formatMessage(messages.addGroupServiceAccountsErrorTitle, { count: getState().values['service-accounts-list'].length })
      }
      text={
        submittingGroup
          ? intl.formatMessage(messages.groupNameTakenText)
          : intl.formatMessage(messages.addNewGroupServiceAccountsErrorDescription, { count: getState().values['service-accounts-list'].length })
      }
      customFooter={
        submittingGroup ? undefined : (
          <Button variant={ButtonVariant.primary} onClick={() => navigate(pathnames.groups.link)}>
            {intl.formatMessage(messages.close)}
          </Button>
        )
      }
    />
  ) : (
    <React.Fragment>
      <Title headingLevel="h1" size="xl" className="pf-v5-u-mb-lg">
        {intl.formatMessage(messages.reviewDetails)}
      </Title>
      {[[{ ...formFields?.[0]?.[0] }]]}
    </React.Fragment>
  );
};

ReviewTemplate.propTypes = {
  formFields: PropTypes.array,
};

export default ReviewTemplate;
