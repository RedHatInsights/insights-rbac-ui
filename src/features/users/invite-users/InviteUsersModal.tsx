import React, { Fragment, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Checkbox } from '@patternfly/react-core/dist/dynamic/components/Checkbox';
import { ExpandableSection } from '@patternfly/react-core/dist/dynamic/components/ExpandableSection';
import { Form } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Modal } from '@patternfly/react-core/dist/dynamic/components/Modal';
import { ModalVariant } from '@patternfly/react-core';
import { TextArea } from '@patternfly/react-core/dist/dynamic/components/TextArea';
import { useDispatch } from 'react-redux';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import messages from '../../../Messages';
import { addUsers } from '../../../redux/users/actions';
import paths from '../../../utilities/pathnames';
import { useAppLink } from '../../../hooks/useAppLink';

interface InviteUsersModalProps {
  fetchData: () => void;
}

const InviteUsersModal: React.FC<InviteUsersModalProps> = ({ fetchData }) => {
  const dispatch = useDispatch();
  const intl = useIntl();
  const navigate = useNavigate();
  const toAppLink = useAppLink();

  const [isCheckboxLabelExpanded, setIsCheckboxLabelExpanded] = useState(false);
  const [areNewUsersAdmins, setAreNewUsersAdmins] = useState(false);
  const [rawEmails, setRawEmails] = useState('');
  const [userEmailList, setUserEmailList] = useState<string[]>([]);
  const [cancelWarningVisible, setCancelWarningVisible] = useState(false);

  const onSubmit = () => {
    const newUsersData = { emails: userEmailList, isAdmin: areNewUsersAdmins };
    (dispatch(addUsers(newUsersData, {} as Parameters<typeof addUsers>[1], false) as unknown as { type: string }) as unknown as Promise<void>)
      .then(() => {
        fetchData();
        navigate(toAppLink(paths.users.link) as string);
      })
      .catch((err: Error) => {
        console.error(err);
      });
  };

  const onCancel = () => (userEmailList?.length > 0 && setCancelWarningVisible(true)) || redirectToUsers();

  const onCheckboxLabelToggle = (isExpanded: boolean) => {
    setIsCheckboxLabelExpanded(isExpanded);
  };

  const extractEmails = (rawEmails: string) => {
    const regex = /([a-zA-Z0-9._+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
    const emails = rawEmails.match(regex) || [];
    setUserEmailList(emails);
  };

  const handleRawEmailsChange = (value: string) => {
    setRawEmails(value);
  };

  const redirectToUsers = () => {
    dispatch(
      addNotification({
        variant: 'warning',
        title: intl.formatMessage(messages.inviteUsers),
        description: intl.formatMessage(messages.inviteUsersCancelled),
      }),
    );
    navigate(toAppLink(paths.users.link) as string);
  };

  useEffect(() => {
    extractEmails(rawEmails);
  }, [rawEmails]);

  return (
    <Fragment>
      <WarningModal
        title={intl.formatMessage(messages.exitItemAdding, { item: intl.formatMessage(messages.users).toLocaleLowerCase() })}
        isOpen={cancelWarningVisible}
        onClose={() => setCancelWarningVisible(false)}
        confirmButtonLabel={intl.formatMessage(messages.discard)}
        onConfirm={redirectToUsers}
      >
        {intl.formatMessage(messages.changesWillBeLost)}
      </WarningModal>
      <Modal
        variant={ModalVariant.medium}
        isOpen={!cancelWarningVisible}
        title={intl.formatMessage(messages.inviteUsersTitle)}
        description={intl.formatMessage(messages.inviteUsersDescription)}
        onClose={onCancel}
        actions={[
          <Button
            aria-label="Save"
            className="pf-v5-u-mr-sm"
            ouiaId="primary-save-button"
            variant="primary"
            key="save"
            onClick={onSubmit}
            isDisabled={userEmailList?.length == 0}
          >
            {intl.formatMessage(messages.inviteUsersButton)}
          </Button>,
          <Button aria-label="Cancel" ouiaId="secondary-cancel-button" variant="link" key="cancel" onClick={onCancel}>
            {intl.formatMessage(messages.cancel)}
          </Button>,
        ]}
      >
        <Form id="invite-users-form" className="rbac-c-user_invite-users-form">
          <FormGroup label={intl.formatMessage(messages.inviteUsersFormEmailsFieldTitle)} isRequired fieldId="invite-users-email-list-field">
            <TextArea
              isRequired
              type="text"
              id="invite-user-email-list"
              name="invite-user-email-list"
              value={rawEmails}
              placeholder={intl.formatMessage(messages.inviteUsersFormEmailsFieldDescription)}
              onChange={(_event, value) => handleRawEmailsChange(value)}
            />
          </FormGroup>

          <div id="invite-users-is-admin-field" style={{ display: 'flex', alignItems: 'baseline' }}>
            <Checkbox isChecked={areNewUsersAdmins} onChange={() => setAreNewUsersAdmins(!areNewUsersAdmins)} label="" id="invite-users-is-admin" />
            <ExpandableSection
              toggleText={intl.formatMessage(messages.inviteUsersFormIsAdminFieldTitle)}
              onToggle={(_event, isExpanded) => onCheckboxLabelToggle(isExpanded)}
              isExpanded={isCheckboxLabelExpanded}
            >
              {intl.formatMessage(messages.inviteUsersFormIsAdminFieldDescription)}
            </ExpandableSection>
          </div>
        </Form>
      </Modal>
    </Fragment>
  );
};

// Feature component (used by Routing.tsx) - both named and default exports
export { InviteUsersModal };
export default InviteUsersModal;
