import React, { useContext, useEffect } from 'react';
import { useIntl } from 'react-intl';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { Bullseye } from '@patternfly/react-core/dist/dynamic/layouts/Bullseye';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { ButtonVariant } from '@patternfly/react-core/dist/dynamic/components/Button';
import { EmptyState, EmptyStateVariant } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { Progress } from '@patternfly/react-core/dist/dynamic/components/Progress';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import InProgressIcon from '@patternfly/react-icons/dist/js/icons/in-progress-icon';
import { asyncValidator } from '../validators';
import useAppNavigate from '../../../../shared/hooks/useAppNavigate';
import { WizardError } from '../../../../shared/components/ui-states/WizardError';
import pathnames from '../../../utilities/pathnames';
import messages from '../../../../Messages';
import { AddGroupWizardContext } from './add-group-wizard-context';

/** The wizard step's form fields, re-rendered read-only on the review step. */
interface ReviewTemplateProps {
  formFields?: React.ReactNode[][];
}

const ReviewTemplate: React.FC<ReviewTemplateProps> = ({ formFields }) => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const { submittingGroup, submittingServiceAccounts, error, setWizardError } = useContext(AddGroupWizardContext);
  const { getState } = useFormApi();
  useEffect(() => {
    setWizardError(undefined);
    const groupName = getState().values['group-name'];
    asyncValidator(intl, groupName, 'uuid')
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
        titleText={intl.formatMessage(messages.groupBeingCreated)}
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
      context={{ setWizardError: (e) => setWizardError?.(e as boolean | undefined) }}
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
          <Button variant={ButtonVariant.primary} onClick={() => navigate(pathnames.groups.link())}>
            {intl.formatMessage(messages.close)}
          </Button>
        )
      }
    />
  ) : (
    <React.Fragment>
      <Title headingLevel="h1" size="xl" className="pf-v6-u-mb-lg">
        {intl.formatMessage(messages.reviewDetails)}
      </Title>
      {/* Legacy render shape carried over from the JS original: spread of the first step field. */}
      {[[{ ...(formFields?.[0]?.[0] as unknown as Record<string, unknown>) }]]}
    </React.Fragment>
  );
};

export default ReviewTemplate;
