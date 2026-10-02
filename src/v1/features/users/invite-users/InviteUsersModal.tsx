import React, { Fragment, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Checkbox } from '@patternfly/react-core/dist/dynamic/components/Checkbox';
import { ExpandableSection } from '@patternfly/react-core/dist/dynamic/components/ExpandableSection';
import { Form } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Modal } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { ModalVariant } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { TextArea } from '@patternfly/react-core/dist/dynamic/components/TextArea';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';

import { useInviteUsersMutation } from '../../../../shared/data/queries/users';
import paths from '../../../utilities/pathnames';
import useAppNavigate from '../../../../shared/hooks/useAppNavigate';
import { getModalContainer } from '../../../../shared/helpers/modal-container';
import { commonMessages } from '../../../../shared/messages/common';

interface InviteUsersModalProps {
  fetchData: () => void;
}

const InviteUsersModal: React.FC<InviteUsersModalProps> = ({ fetchData }) => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const addNotification = useAddNotification();

  const [isCheckboxLabelExpanded, setIsCheckboxLabelExpanded] = useState(false);
  const [areNewUsersAdmins, setAreNewUsersAdmins] = useState(false);
  const [rawEmails, setRawEmails] = useState('');
  const [userEmailList, setUserEmailList] = useState<string[]>([]);
  const [cancelWarningVisible, setCancelWarningVisible] = useState(false);

  const inviteUsersMutation = useInviteUsersMutation();

  const onSubmit = async () => {
    try {
      await inviteUsersMutation.mutateAsync({
        emails: userEmailList,
        isAdmin: areNewUsersAdmins,
      });
      addNotification({
        variant: 'success',
        title: 'Invitation sent successfully',
        dismissable: true,
      });
      fetchData();
      navigate(paths.users.link());
    } catch (err) {
      console.error(err);
      addNotification({
        variant: 'danger',
        title: intl.formatMessage({
          id: 'inviteUsersErrorTitle',
          defaultMessage: 'Failed inviting all users',
          description: 'Invite users error notification title',
        }),
        dismissable: true,
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    }
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
    addNotification({
      variant: 'warning',
      title: intl.formatMessage({ id: 'inviteUsers', defaultMessage: 'Invite users', description: 'Invite users' }),
      description: intl.formatMessage({
        id: 'inviteUsersCancelled',
        defaultMessage: 'Invite users process was canceled by the user.',
        description: 'Invite users cancelled notification description',
      }),
    });
    navigate(paths.users.link());
  };

  useEffect(() => {
    extractEmails(rawEmails);
  }, [rawEmails]);

  return (
    <Fragment>
      <WarningModal
        title={intl.formatMessage(
          { id: 'exitItemAdding', defaultMessage: 'Exit {item} adding?', description: 'Exit item adding modal title' },
          { item: intl.formatMessage(commonMessages.users).toLocaleLowerCase() },
        )}
        isOpen={cancelWarningVisible}
        onClose={() => setCancelWarningVisible(false)}
        confirmButtonLabel={intl.formatMessage(commonMessages.discard)}
        onConfirm={redirectToUsers}
      >
        {intl.formatMessage({ id: 'changesWillBeLost', defaultMessage: 'All changes will be lost', description: 'All changes will be lost message' })}
      </WarningModal>
      <Modal
        appendTo={getModalContainer()}
        variant={ModalVariant.medium}
        isOpen={!cancelWarningVisible}
        disableFocusTrap
        title={intl.formatMessage({ id: 'inviteUsersTitle', defaultMessage: 'Invite New Users', description: 'Invite users modal title' })}
        description={intl.formatMessage({
          id: 'inviteUsersDescription',
          defaultMessage:
            'Invite users to create a Red Hat login with your organization. Your name will be included in the invite as a point of reference.',
          description: 'Invite users modal description',
        })}
        onClose={onCancel}
        actions={[
          <Button
            aria-label="Save"
            className="pf-v6-u-mr-sm"
            ouiaId="primary-save-button"
            variant="primary"
            key="save"
            onClick={onSubmit}
            isDisabled={userEmailList?.length == 0}
          >
            {intl.formatMessage({ id: 'inviteUsersButton', defaultMessage: 'Invite new users', description: 'Invite users button text' })}
          </Button>,
          <Button aria-label="Cancel" ouiaId="secondary-cancel-button" variant="link" key="cancel" onClick={onCancel}>
            {intl.formatMessage(commonMessages.cancel)}
          </Button>,
        ]}
      >
        <Form id="invite-users-form" className="rbac-c-user_invite-users-form">
          <FormGroup
            label={intl.formatMessage({
              id: 'inviteUsersFormEmailsFieldTitle',
              defaultMessage: 'Enter the e-mail addresses of the users you would like to invite',
              description: 'Invite users form emails field title',
            })}
            isRequired
            fieldId="invite-users-email-list-field"
          >
            <TextArea
              isRequired
              type="text"
              id="invite-user-email-list"
              name="invite-user-email-list"
              value={rawEmails}
              placeholder={intl.formatMessage({
                id: 'inviteUsersFormEmailsFieldDescription',
                defaultMessage: 'Enter up to 50 email addresses separated by commas or returns.',
                description: 'Invite users form emails field description',
              })}
              onChange={(_event, value) => handleRawEmailsChange(value)}
            />
          </FormGroup>

          <div id="invite-users-is-admin-field" style={{ display: 'flex', alignItems: 'baseline' }}>
            <Checkbox isChecked={areNewUsersAdmins} onChange={() => setAreNewUsersAdmins(!areNewUsersAdmins)} label="" id="invite-users-is-admin" />
            <ExpandableSection
              toggleText={intl.formatMessage({
                id: 'inviteUsersFormIsAdminFieldTitle',
                defaultMessage: 'Organization Administrators',
                description: 'Invite users form is admin field title',
              })}
              onToggle={(_event, isExpanded) => onCheckboxLabelToggle(isExpanded)}
              isExpanded={isCheckboxLabelExpanded}
            >
              {intl.formatMessage({
                id: 'inviteUsersFormIsAdminFieldDescription',
                defaultMessage:
                  'The organization administrator role is the highest permission level with full access to content and features. This is the only role that can manage users.',
                description: 'Invite users form is admin field description',
              })}
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
