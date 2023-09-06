import React from 'react';
import { useIntl } from 'react-intl';
import { Modal, ModalVariant } from '@patternfly/react-core';
import messages from '../../../Messages';

const AddGroupServiceAccounts: React.FC = () => {
  const intl = useIntl();

  return (
    <Modal className="rbac" variant={ModalVariant.medium} isOpen={false} title={intl.formatMessage(messages.addServiceAccount)}>
      null
    </Modal>
  );
};

export default AddGroupServiceAccounts;
