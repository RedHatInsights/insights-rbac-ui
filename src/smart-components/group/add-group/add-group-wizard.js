import React, { useState, createContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { useHistory } from 'react-router-dom';
import FormRenderer from '@data-driven-forms/react-form-renderer/dist/esm/form-renderer';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/dist/esm/form-template';
import componentMapper from '@data-driven-forms/pf4-component-mapper/dist/esm/component-mapper';
import { WarningModal } from '../../common/warningModal';
import schema from './schema';
import { addGroup } from '../../../redux/actions/group-actions';
import SetName from './set-name';
import SetRoles from './set-roles';
import SetUsers from './set-users';
import SummaryContent from './summary-content';
import { createQueryParams } from '../../../helpers/shared/helpers';
import { routes as paths } from '../../../../package.json';

export const AddGroupWizardContext = createContext({
  success: false,
  submitting: false,
  error: undefined,
});

const FormTemplate = (props) => <Pf4FormTemplate {...props} showFormControls={false} />;

const Description = ({ Content, ...rest }) => <Content {...rest} />;
Description.propTypes = {
  Content: PropTypes.elementType.isRequired,
};

export const mapperExtension = {
  description: Description,
  'set-name': SetName,
  'set-roles': SetRoles,
  'set-users': SetUsers,
  'summary-content': SummaryContent,
};

export const onCancel = (emptyCallback, nonEmptyCallback, setGroupData) => (formData) => {
  setGroupData(formData);
  if (Object.keys(formData).length > 0) {
    nonEmptyCallback(true);
  } else {
    emptyCallback();
  }
};

const AddGroupWizard = ({ postMethod, pagination, filters }) => {
  const dispatch = useDispatch();
  const { push } = useHistory();
  const [cancelWarningVisible, setCancelWarningVisible] = useState(false);
  const [groupData, setGroupData] = useState({});
  const [wizardContextValue, setWizardContextValue] = useState({
    success: false,
    submitting: false,
    error: undefined,
    hideForm: false,
  });

  const redirectToGroups = () => {
    dispatch(
      addNotification({
        variant: 'warning',
        title: 'Adding group',
        dismissDelay: 8000,
        dismissable: false,
        description: 'Adding group was canceled by the user.',
      })
    );
    push({
      pathname: paths.groups,
      search: createQueryParams({ page: 1, per_page: pagination.limit, ...filters }),
    });
  };

  const setWizardError = (error) => setWizardContextValue((prev) => ({ ...prev, error }));
  const setWizardSuccess = (success) => setWizardContextValue((prev) => ({ ...prev, success }));
  const setHideForm = (hideForm) => setWizardContextValue((prev) => ({ ...prev, hideForm }));

  const onSubmit = (formData) => {
    const groupData = {
      name: formData['group-name'],
      description: formData['group-description'],
      user_list: formData['users-list'].map((user) => ({ username: user.label })),
      roles_list: formData['roles-list'].map((role) => role.uuid),
    };
    push({
      pathname: paths.groups,
      search: createQueryParams({ page: 1, per_page: pagination.limit }),
    });
    dispatch(addGroup(groupData))
      .then(() => postMethod({ limit: pagination.limit, offset: 0, filters: {} }))
      .then(() => {
        dispatch(
          addNotification({
            variant: 'success',
            title: 'Success adding group',
            dismissDelay: 8000,
            dismissable: false,
            description: 'The group was added successfully.',
          })
        );
      });
  };

  return cancelWarningVisible ? (
    <WarningModal
      type="group"
      isOpen={cancelWarningVisible}
      onModalCancel={() => setCancelWarningVisible(false)}
      onConfirmCancel={redirectToGroups}
    />
  ) : (
    <AddGroupWizardContext.Provider value={{ ...wizardContextValue, setWizardError, setWizardSuccess, setHideForm }}>
      <FormRenderer
        schema={schema}
        subscription={{ values: true }}
        FormTemplate={FormTemplate}
        componentMapper={{ ...componentMapper, ...mapperExtension }}
        onSubmit={onSubmit}
        initialValues={groupData}
        onCancel={onCancel(redirectToGroups, setCancelWarningVisible, setGroupData)}
      />
    </AddGroupWizardContext.Provider>
  );
};

AddGroupWizard.propTypes = {
  postMethod: PropTypes.func,
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
  }).isRequired,
  filters: PropTypes.shape({
    name: PropTypes.string,
  }).isRequired,
};

export default AddGroupWizard;
