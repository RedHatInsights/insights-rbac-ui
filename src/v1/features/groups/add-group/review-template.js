import React, { useContext, useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { Bullseye } from '@patternfly/react-core';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { ButtonVariant } from '@patternfly/react-core';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';

import { EmptyStateVariant } from '@patternfly/react-core';
import { Progress } from '@patternfly/react-core/dist/dynamic/components/Progress';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import {} from '@patternfly/react-core';
import InProgressIcon from '@patternfly/react-icons/dist/js/icons/in-progress-icon';
import { asyncValidator } from '../validators';
import useAppNavigate from '../../../../shared/hooks/useAppNavigate';
import { WizardError } from '../../../../shared/components/ui-states/WizardError';
import pathnames from '../../../utilities/pathnames';

import { AddGroupWizardContext } from './add-group-wizard-context';
import { commonMessages } from '../../../../shared/messages/common';

const messages = defineMessages({
  creatingGroup: { id: 'creatingGroup', defaultMessage: 'Creating a group', description: 'Creating group label' },
  associatingServiceAccounts: {
    id: 'associatingServiceAccounts',
    defaultMessage: 'Associating service accounts',
    description: 'Adding service accounts label',
  },
});

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
        <Spinner className="pf-v6-u-mt-xl" size="xl" />
      </Bullseye>
    );
  }

  if (submittingServiceAccounts && !error) {
    const value = submittingGroup ? 1 : submittingServiceAccounts ? 2 : 3;
    return (
      <EmptyState
        headingLevel="h4"
        icon={InProgressIcon}
        titleText={intl.formatMessage({
          id: 'groupBeingCreated',
          defaultMessage: 'The group is being created',
          description: 'Creating group step title',
        })}
        variant={EmptyStateVariant.lg}
        data-component-ouia-id="wizard-progress"
        className="rbac-add-group-progress"
      >
        <Progress
          className="pf-v6-u-mt-lg"
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
          ? intl.formatMessage({ id: 'groupNameTakenTitle', defaultMessage: 'Group name already taken', description: 'Group name taken error title' })
          : intl.formatMessage(
              {
                id: 'addGroupServiceAccountsErrorTitle',
                defaultMessage: 'Failed adding service {count, plural, one {account} other {accounts}} to group',
                description: 'Add group service accounts error notification title',
              },
              { count: getState().values['service-accounts-list'].length },
            )
      }
      text={
        submittingGroup
          ? intl.formatMessage({
              id: 'groupNameTakenText',
              defaultMessage: 'Please return to Step 1: Group information and choose a unique group name for your group.',
              description: 'Group name taken error text',
            })
          : intl.formatMessage(
              {
                id: 'addNewGroupServiceAccountsErrorDescription',
                defaultMessage:
                  'The group has been created, but the service {count, plural, one {account was} other {accounts were}} not associated successfully. Try adding the the service {count, plural, one {account} other {accounts}} later.',
                description: 'Add group service accounts error notification description',
              },
              { count: getState().values['service-accounts-list'].length },
            )
      }
      customFooter={
        submittingGroup ? undefined : (
          <Button variant={ButtonVariant.primary} onClick={() => navigate(pathnames.groups.link)}>
            {intl.formatMessage({ id: 'close', defaultMessage: 'Close', description: 'Close button text' })}
          </Button>
        )
      }
    />
  ) : (
    <React.Fragment>
      <Title headingLevel="h1" size="xl" className="pf-v6-u-mb-lg">
        {intl.formatMessage(commonMessages.reviewDetails)}
      </Title>
      {[[{ ...formFields?.[0]?.[0] }]]}
    </React.Fragment>
  );
};

ReviewTemplate.propTypes = {
  formFields: PropTypes.array,
};

export default ReviewTemplate;
