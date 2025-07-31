import React, { Fragment, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { Button, Checkbox, ExpandableSection, Form, FormGroup, Modal, ModalVariant, TextArea } from '@patternfly/react-core';
import { useDispatch } from 'react-redux';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import messages from '../../../Messages';
import { addUsers } from '../../../redux/users/actions';
import PropTypes from 'prop-types';
import paths from '../../../utilities/pathnames';
import { mergeToBasename } from '../../../components/navigation/AppLink';

const InviteUsersModal = ({ fetchData }) => {
  const dispatch = useDispatch();
  const intl = useIntl();
  const navigate = useNavigate();

  const [isCheckboxLabelExpanded, setIsCheckboxLabelExpanded] = useState(false);
  const [areNewUsersAdmins, setAreNewUsersAdmins] = useState(false);
  const [rawEmails, setRawEmails] = useState('');
  const [userEmailList, setUserEmailList] = useState([]);
  const [cancelWarningVisible, setCancelWarningVisible] = useState(false);

  const onSubmit = () => {
    const newUsersData = { emails: userEmailList, isAdmin: areNewUsersAdmins };
    dispatch(addUsers(newUsersData))
      .then(() => {
        fetchData();
        navigate(mergeToBasename(paths.users.link));
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const onCancel = () => (userEmailList?.length > 0 && setCancelWarningVisible(true)) || redirectToUsers();

  const onCheckboxLabelToggle = (isExpanded) => {
    setIsCheckboxLabelExpanded(isExpanded);
  };

  const extractEmails = (rawEmails) => {
    const regex = /([a-zA-Z0-9._+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
    let emails = rawEmails.match(regex) || [];
    setUserEmailList(emails);
  };

  const handleRawEmailsChange = (value) => {
    setRawEmails(value);
  };

  const redirectToUsers = () => {
    dispatch(
      addNotification({
        variant: 'warning',
        title: intl.formatMessage(messages.inviteUsers),
        dismissDelay: 8000,
        description: intl.formatMessage(messages.inviteUsersCancelled),
      }),
    );
    navigate(mergeToBasename(paths.users.link));
  };

  useEffect(() => {
    extractEmails(rawEmails);
  }, [rawEmails]);

  return (
    <Fragment>
      <WarningModal
        type="user"
        isOpen={cancelWarningVisible}
        onModalCancel={() => setCancelWarningVisible(false)}
        onConfirmCancel={redirectToUsers}
      />
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
              onToggle={onCheckboxLabelToggle}
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

InviteUsersModal.propTypes = {
  fetchData: PropTypes.func.isRequired,
};

export default InviteUsersModal;
