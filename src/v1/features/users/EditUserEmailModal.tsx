import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Form, FormGroup, FormHelperText } from '@patternfly/react-core/dist/dynamic/components/Form';
import { HelperText, HelperTextItem } from '@patternfly/react-core/dist/dynamic/components/HelperText';
import { TextInput } from '@patternfly/react-core/dist/dynamic/components/TextInput';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant } from '@patternfly/react-core/dist/dynamic/components/Modal';
import { getModalContainer } from '../../../shared/helpers/modal-container';
import { useUpdateUserEmailMutation } from '../../../shared/data/queries/users';
import messages from '../../../Messages';

// Mirror the invite modal's validation so the two email entry points behave identically.
const EMAIL_REGEXP = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface EditUserEmailModalProps {
  isOpen: boolean;
  /** Username of the user being edited (shown in the description, keys the cache patch). */
  username: string;
  /** The account API user id (the principal's `external_source_id`), required to submit. */
  userId: string;
  /** Current saved email, used to prepopulate the field. */
  currentEmail: string;
  onClose: () => void;
}

/**
 * Dialog for correcting an existing user's email address via the IT Account API.
 *
 * The field is prepopulated with the current email, validated for a plausible address, and
 * submitted through `useUpdateUserEmailMutation`. On success the modal closes and the detail
 * view reflects the new address (optimistic cache patch). On failure the modal stays open and
 * the mutation surfaces an error toast, leaving the saved email unchanged.
 */
export const EditUserEmailModal: React.FC<EditUserEmailModalProps> = ({ isOpen, username, userId, currentEmail, onClose }) => {
  const intl = useIntl();
  const [email, setEmail] = useState(currentEmail);
  const [touched, setTouched] = useState(false);
  const updateEmail = useUpdateUserEmailMutation();

  const trimmed = email.trim();
  const validationError = trimmed.length === 0 ? messages.editEmailRequired : !EMAIL_REGEXP.test(trimmed) ? messages.editEmailInvalid : undefined;
  const showError = touched && !!validationError;

  const handleClose = () => {
    // Discard the unsaved change: reset local state so the next open starts from the saved value.
    setEmail(currentEmail);
    setTouched(false);
    onClose();
  };

  const handleDismiss = () => {
    if (updateEmail.isPending) {
      return;
    }
    handleClose();
  };

  const handleSubmit = async () => {
    setTouched(true);
    if (validationError || updateEmail.isPending) {
      return;
    }
    try {
      await updateEmail.mutateAsync({ userId, email: trimmed, username });
      handleClose();
    } catch {
      // onError in the mutation surfaces a toast; keep the modal open so the admin can retry.
    }
  };

  return (
    <Modal
      variant={ModalVariant.small}
      isOpen={isOpen}
      onClose={handleDismiss}
      appendTo={getModalContainer()}
      ouiaId="edit-user-email-modal"
      aria-labelledby="edit-user-email-modal-title"
    >
      <ModalHeader title={intl.formatMessage(messages.editEmailTitle)} labelId="edit-user-email-modal-title" />
      <ModalBody>
        <Content component="p" className="pf-v6-u-mb-md">
          {intl.formatMessage(messages.editEmailDescription, { username })}
        </Content>
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <FormGroup label={intl.formatMessage(messages.editEmailFieldLabel)} isRequired fieldId="edit-user-email-input">
            <TextInput
              id="edit-user-email-input"
              type="email"
              value={email}
              isRequired
              validated={showError ? 'error' : 'default'}
              onChange={(_event, value) => setEmail(value)}
              onBlur={() => setTouched(true)}
              aria-label={intl.formatMessage(messages.editEmailFieldLabel)}
            />
            {showError && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem variant="error">{intl.formatMessage(validationError)}</HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          key="save"
          variant="primary"
          ouiaId="edit-user-email-save"
          onClick={() => void handleSubmit()}
          isLoading={updateEmail.isPending}
          isDisabled={updateEmail.isPending || (touched && !!validationError)}
        >
          {intl.formatMessage(messages.save)}
        </Button>
        <Button key="cancel" variant="link" ouiaId="edit-user-email-cancel" onClick={handleClose} isDisabled={updateEmail.isPending}>
          {intl.formatMessage(messages.cancel)}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
