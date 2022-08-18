import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import messages from '../../Messages';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { Button, Checkbox, Modal, ModalVariant, Split, SplitItem, Stack, TextContent } from '@patternfly/react-core';
import './RemoveModal.scss';

const RemoveModal = ({ title, text, onClose, onSubmit, isOpen, confirmButtonLabel, withCheckbox }) => {
  const intl = useIntl();
  const [checked, setChecked] = useState(false);

  return (
    <Modal
      className="rbac"
      title={
        <div>
          <ExclamationTriangleIcon className="ins-m-alert rbac-c__delete-icon" /> {title}
        </div>
      }
      isOpen={isOpen}
      variant={ModalVariant.small}
      onClose={onClose}
      actions={[
        <Button key="confirm" ouiaId="primary-confirm-button" isDisabled={withCheckbox && !checked} variant="danger" onClick={onSubmit}>
          {confirmButtonLabel}
        </Button>,
        <Button key="cancel" ouiaId="secondary-cancel-button" variant="link" onClick={onClose}>
          {intl.formatMessage(messages.cancel)}
        </Button>,
      ]}
    >
      <Split hasGutter>
        <SplitItem isFilled>
          <Stack hasGutter>
            <TextContent>{text}</TextContent>
          </Stack>
        </SplitItem>
      </Split>
      {withCheckbox ? (
        <Checkbox
          isChecked={checked}
          onChange={() => setChecked(!checked)}
          label={intl.formatMessage(messages.confirmCheckMessage)}
          id="remove-modal-check"
          className="pf-u-mt-lg"
        />
      ) : null}
    </Modal>
  );
};

RemoveModal.propTypes = {
  text: PropTypes.any,
  title: PropTypes.string,
  confirmButtonLabel: PropTypes.string,
  onSubmit: PropTypes.func,
  onClose: PropTypes.func,
  isOpen: PropTypes.bool,
  withCheckbox: PropTypes.bool,
};

RemoveModal.defaultProps = {
  withCheckbox: false,
};

export default RemoveModal;
