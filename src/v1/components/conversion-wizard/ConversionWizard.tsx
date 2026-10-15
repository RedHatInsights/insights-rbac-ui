import React, { useState } from 'react';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import { IntlShape, useIntl } from 'react-intl';
import { AxiosError } from 'axios';
// Deprecated Modal: this is the same implementation the data-driven-forms pf4 wizard renders
// internally, so keeping it preserves the wizard's existing appearance and behaviour.
import { Modal } from '@patternfly/react-core/deprecated';
import { getModalContainer } from '../../../shared/helpers/modal-container';
import { WIZARD_TITLE, schemaBuilder, wizardMapper } from './schema';
import { ConversionCompleteStep } from './components/ConversionCompleteStep';
import { ConversionFailedStep } from './components/ConversionFailedStep';
import { requiredCheckboxValidator } from './validators';
import messages from '../../../Messages';
import { TenantApiErrorResponse, TenantOptInIneligibleResponse, tenantApi } from '../../../shared/data/api/tenant';

export interface ConversionWizardProps {
  /** Callback when wizard is cancelled */
  onCancel: () => void;
  /**
   * Called when the user dismisses the success screen. The tenant is on V2 by this point, so
   * the caller is responsible for getting them onto a V2 page.
   */
  onSuccess?: () => void;
}

const FormTemplate = (props: React.ComponentProps<typeof Pf4FormTemplate>) => <Pf4FormTemplate {...props} showFormControls={false} />;

/** Scopes the one CSS rule this component needs to its own modal. */
const MODAL_CLASS = 'rbac-conversion-wizard-modal';

/** Which screen the conversion modal is currently showing. */
type ConversionStatus = 'form' | 'converting' | 'complete' | 'failed';

/**
 * Mirrors `.ddorg__pf4-component-mapper__wizard` from the data-driven-forms wizard stylesheet.
 * The wizard sizes the modal box via that rule, so the spinner and success screens need the same
 * dimensions to keep the modal from collapsing to their (much shorter) content height.
 */
const WIZARD_BOX_SIZE: React.CSSProperties = { height: 'calc(100vh - 48px)', maxHeight: '762px' };

/**
 * Names the roles and groups the API says are blocking conversion. The eligibility endpoint
 * reports these on a 200, and PATCH repeats them in its 422 body.
 */
const ineligibilityDetail = (body: TenantOptInIneligibleResponse, intl: IntlShape): string => {
  const blockers = [...(body.ineligible_custom_roles ?? []), ...(body.ineligible_groups ?? [])].map(({ name }) => name);

  return blockers.length > 0
    ? intl.formatMessage(messages.conversionWizardFailedDetailIneligibleItems, { items: blockers.join(', ') })
    : intl.formatMessage(messages.conversionWizardFailedDetailIneligible);
};

/**
 * Turns a rejected conversion request into the sentence shown under the generic failure message.
 * The failure screen always says the same thing; this adds what the user can actually do about it.
 */
const failureDetail = (error: unknown, intl: IntlShape): string => {
  const { request, response } = (error ?? {}) as AxiosError<TenantApiErrorResponse | TenantOptInIneligibleResponse>;

  // The request went out but nothing came back, so the server never saw it.
  if (request && !response) {
    return intl.formatMessage(messages.conversionWizardFailedDetailNetwork);
  }

  // 422 answers with the ineligibility report rather than the usual error envelope.
  if (response?.status === 422) {
    return ineligibilityDetail(response.data as TenantOptInIneligibleResponse, intl);
  }

  // Everything else carries an RBAC error envelope. Its `detail` is written for this
  // exact failure, so it beats anything generic we could say in its place.
  const serverDetail = (response?.data as TenantApiErrorResponse | undefined)?.errors?.find(({ detail }) => detail)?.detail;
  if (serverDetail) {
    return serverDetail;
  }

  return response?.status === 403
    ? intl.formatMessage(messages.conversionWizardFailedDetailForbidden)
    : intl.formatMessage(messages.conversionWizardFailedDetailGeneric);
};

export const ConversionWizard: React.FC<ConversionWizardProps> = ({ onCancel, onSuccess }) => {
  const [status, setStatus] = useState<ConversionStatus>('form');
  const [errorDetail, setErrorDetail] = useState<string>();
  const intl = useIntl();

  const schema = schemaBuilder(intl);

  const validatorMapper = {
    'required-checkbox': requiredCheckboxValidator(intl),
  };

  const onSubmit = async () => {
    setStatus('converting');

    try {
      // Ask first: an ineligible tenant gets a definitive answer here, so there is no point
      // sending a PATCH that could only come back as a 422 saying the same thing.
      const eligibility = await tenantApi.getEligibility();

      if (!eligibility.eligible) {
        setErrorDetail(ineligibilityDetail(eligibility, intl));
        setStatus('failed');
        return;
      }

      // Convert the tenant to workspace-based access management
      await tenantApi.optIn();

      setStatus('complete');
    } catch (error) {
      // Every failure mode shows the same screen, which points at the troubleshooting docs;
      // only the detail line underneath differs by cause.
      setErrorDetail(failureDetail(error, intl));
      setStatus('failed');
    }
  };

  const handleConversionComplete = () => {
    if (onSuccess) {
      onSuccess();
    }
  };

  // A single modal hosts the whole flow. Its children swap between the wizard form and the
  // spinner/success/failure screens, so the modal itself never unmounts and remounts.
  return (
    <Modal
      variant="large"
      isOpen
      onClose={onCancel}
      hasNoBodyWrapper
      appendTo={getModalContainer()}
      className={`pf-v6-c-form ${MODAL_CLASS}`}
      aria-label={WIZARD_TITLE}
    >
      {/*
        The wizard's header is `position: relative`, so it paints over the modal's absolutely
        positioned close button and hides the left half of the X. PatternFly exposes no z-index
        token for that button and the project carries no stylesheet, so the one rule it needs is
        scoped to this modal and inlined here.
      */}
      <style>{`.${MODAL_CLASS} > .pf-v6-c-modal-box__close { z-index: 1; }`}</style>
      {status === 'form' ? (
        <FormRenderer
          schema={schema}
          FormTemplate={FormTemplate}
          componentMapper={wizardMapper}
          validatorMapper={validatorMapper}
          onSubmit={onSubmit}
          onCancel={onCancel}
          subscription={{ submitting: true, pristine: true }}
        />
      ) : (
        // No header on the result screens: the wizard title would render as unstyled text and
        // overlap the modal's close button. The box keeps the wizard's dimensions so the modal
        // does not shrink to the (much shorter) result content.
        <div
          style={WIZARD_BOX_SIZE}
          className="pf-v6-u-display-flex pf-v6-u-flex-direction-column pf-v6-u-align-items-center pf-v6-u-justify-content-center"
        >
          {status === 'failed' ? (
            <ConversionFailedStep detail={errorDetail} />
          ) : (
            <ConversionCompleteStep isLoading={status === 'converting'} onComplete={handleConversionComplete} />
          )}
        </div>
      )}
    </Modal>
  );
};
