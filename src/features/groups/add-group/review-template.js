import React, { useContext, useEffect } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { Bullseye } from '@patternfly/react-core';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { ButtonVariant } from '@patternfly/react-core';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateHeader } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateVariant } from '@patternfly/react-core';
import { Progress } from '@patternfly/react-core/dist/dynamic/components/Progress';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import {} from '@patternfly/react-core';
import InProgressIcon from '@patternfly/react-icons/dist/js/icons/in-progress-icon';
import { asyncValidator } from '../validators';
import useAppNavigate from '../../../hooks/useAppNavigate';
import { WizardError } from '../../../components/ui-states/WizardError';
import pathnames from '../../../utilities/pathnames';
import messages from '../../../Messages';
import './review-step.scss';
import { AddGroupWizardContext } from './add-group-wizard-context';

const ReviewTemplate = ({ formFields }) => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const { submittingGroup, submittingServiceAccounts, error, setWizardError } = useContext(AddGroupWizardContext);
  const { getState } = useFormApi();
  useEffect(() => {
    setWizardError(undefined);
    const groupName = getState().values['group-name'];
    asyncValidator(groupName, 'uuid')
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
    const value = submittingGroup ? 1 : submittingServiceAccounts ? 2 : 3;
    return (
      <EmptyState variant={EmptyStateVariant.lg} data-component-ouia-id="wizard-progress" className="rbac-add-group-progress">
        <EmptyStateHeader
          titleText={intl.formatMessage(messages.groupBeingCreated)}
          icon={<EmptyStateIcon className="pf-v5-u-mt-xl" icon={InProgressIcon} />}
          headingLevel="h4"
        />
        <Progress
          className="pf-v5-u-mt-lg"
          style={{ textAlign: 'left' }}
          min={0}
          max={3}
          value={value}
          label={`${submittingGroup ? 1 : 2} of 2`}
          title={intl.formatMessage(submittingGroup ? messages.creatingGroup : messages.associatingServiceAccounts)}
        />
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
