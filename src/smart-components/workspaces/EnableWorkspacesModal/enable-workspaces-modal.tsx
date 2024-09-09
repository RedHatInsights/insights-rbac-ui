import React from 'react';
import { Modal, ModalVariant, Title, TitleSizes } from '@patternfly/react-core';
import { useIntl } from 'react-intl';
import Messages from '../../../Messages';

const EnableWorkspacesModal: React.FunctionComponent = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleModalToggle = (_event: KeyboardEvent | React.MouseEvent) => {
    setIsModalOpen((prevIsModalOpen) => !prevIsModalOpen);
  };

  const intl = useIntl();

  const header = (
    <React.Fragment>
      <Title id="enable-workspaces-modal-header" headingLevel="h1" size={TitleSizes['2xl']}>
        {intl.formatMessage(Messages.enableWorkspacesWizardTitle)}
      </Title>
      <p>{intl.formatMessage(Messages.enableWorkspacesWizardDesc)}</p>
    </React.Fragment>
  );

  return (
    /* eslint-disable react/no-children-prop */
    <React.Fragment>
      <Modal variant={ModalVariant.large} header={header} isOpen={isModalOpen} onClose={handleModalToggle} children={undefined}></Modal>
    </React.Fragment>
  );
};

export default EnableWorkspacesModal;
