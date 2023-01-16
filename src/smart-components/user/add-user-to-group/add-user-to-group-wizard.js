import React, { useRef, useContext, useState, useEffect } from 'react';
import { Modal, Button, ModalVariant, Alert } from '@patternfly/react-core';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import { createRows } from '../../group/group-table-helpers';
import { applyFiltersToUrl, areFiltersPresentInUrl, syncDefaultFiltersWithUrl } from '../../../helpers/shared/filters';
import PropTypes from 'prop-types';
import { WarningModal } from '../../common/warningModal';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import GroupRowWrapper from '../../group/group-row-wrapper';
import { sortable } from '@patternfly/react-table';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { createQueryParams } from '../../../helpers/shared/helpers';
import messages from '../../../Messages';
import { useIntl } from 'react-intl';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { useFieldApi } from '@data-driven-forms/react-form-renderer';
import PermissionsContext from '../../../utilities/permissions-context';
import { addMembersToGroup, fetchGroups } from '../../../redux/actions/group-actions';
import { useHistory } from 'react-router-dom';
import { getUserGroups } from '../../../helpers/group/group-helper';

const FORM_ID = 'add-user-to-group-form';

const GroupTable = (conf) => {
  const { input, user } = useFieldApi(conf);
  const textFilterRef = useRef(null);
  const { orgAdmin, userAccessAdministrator } = useContext(PermissionsContext);
  const isAdmin = orgAdmin || userAccessAdministrator;
  const dispatch = useDispatch();
  const intl = useIntl();
  const history = useHistory();

  const columns = [
    { title: intl.formatMessage(messages.name), key: 'name', transforms: [sortable] },
    { title: intl.formatMessage(messages.roles) },
    { title: intl.formatMessage(messages.members) },
    { title: intl.formatMessage(messages.lastModified), key: 'modified', transforms: [sortable] },
  ];

  const { groups, meta, filters, isLoading } = useSelector(
    ({ groupReducer: { groups, isLoading } }) => ({
      groups: [...(groups?.data?.filter(({ platform_default, admin_default } = {}) => !(platform_default || admin_default)) || [])],
      meta: groups?.pagination || groups?.meta,
      filters: groups?.filters || '',
      isLoading,
    }),
    shallowEqual
  );
  const [filterValue, setFilterValue] = useState(filters.name || '');
  const [data, setData] = useState(undefined);

  const setCheckedItems = (newSelection) => {
    const rows = input.value || [];
    const selection = newSelection(rows)
      .filter(({ platform_default: isPlatformDefault, admin_default: isAdminDefault }) => !(isPlatformDefault || isAdminDefault))
      .map(({ uuid, name }) => ({ uuid, label: name }));

    input.onChange(selection);
  };
  const fetchData = (options) => dispatch(fetchGroups({ ...options, inModal: true }));

  useEffect(() => {
    const { name } = syncDefaultFiltersWithUrl(history, ['name'], { name: filterValue });
    setFilterValue(name);
    Promise.all([fetchData({ ...meta, filters: { name } }), getUserGroups({ userName: user })]).then(([respData, respGroups]) => {
      const filtered = respData.value.data.filter(({ name: id1 }) => !respGroups.data.some(({ name: id2 }) => id2 === id1));

      setData(filtered);
    }, []);
  }, []);
  useEffect(() => {
    filterValue?.length > 0 && !areFiltersPresentInUrl(history, ['name']) && syncDefaultFiltersWithUrl(history, ['name'], { name: filterValue });
  });

  return (
    <TableToolbarView
      data={data}
      rows={createRows(isAdmin, data || [], false, input.value)}
      columns={columns}
      isSelectable={isAdmin}
      checkedRows={input.value || []}
      setCheckedItems={setCheckedItems}
      titlePlural={intl.formatMessage(messages.groups).toLowerCase()}
      titleSingular={intl.formatMessage(messages.group).toLowerCase()}
      ouiaId="available-user-groups-table"
      pagination={meta}
      filterValue={filterValue}
      fetchData={(config) => {
        const { name, orderBy } = config;
        applyFiltersToUrl(history, { name });
        return fetchData({ orderBy, filters: { name } });
      }}
      setFilterValue={({ name = '' }) => setFilterValue(name)}
      isLoading={!isLoading && groups?.length === 0 && filterValue?.length === 0 ? true : isLoading}
      filterPlaceholder={intl.formatMessage(messages.name).toLowerCase()}
      rowWrapper={GroupRowWrapper}
      tableId="available-user-groups"
      textFilterRef={textFilterRef}
    />
  );
};

const componentMapper = {
  'group-table': GroupTable,
};

const CustomButtons = () => {
  const { onCancel, getState } = useFormApi();
  const intl = useIntl();

  return (
    <div className="pf-c-form__actions">
      <Button
        aria-label="Save"
        ouiaId="primary-save-button"
        variant="primary"
        key="confirm"
        type="submit"
        form={FORM_ID}
        isDisabled={getState().values.groups?.length === 0 || !getState().values.groups}
      >
        {intl.formatMessage(messages.addToGroup)}
      </Button>
      <Button aria-label="Cancel" ouiaId="secondary-cancel-button" variant="link" key="cancel" onClick={onCancel}>
        {intl.formatMessage(messages.cancel)}
      </Button>
      ,
    </div>
  );
};

const ModalFormTemplate = ({ user, ModalProps, onCancel, ...props }) => {
  const { getState } = useFormApi();
  const values = getState().values;
  const intl = useIntl();
  return (
    <Modal
      footer={<CustomButtons />}
      variant={ModalVariant.large}
      isOpen
      title={intl.formatMessage(messages.addSpecificUserToAGroup, { user })}
      onClose={() => {
        onCancel(values);
      }}
    >
      <Alert variant="info" isInline isPlain title={intl.formatMessage(messages.onlyNonUserGroupsVisible)} />
      <Pf4FormTemplate {...props} showFormControls={false} formWrapperProps={{ id: FORM_ID }} />
    </Modal>
  );
};

ModalFormTemplate.propTypes = {
  ModalProps: PropTypes.object,
  ...CustomButtons.propTypes,
};

const AddUserToAGroupWizard = ({ user, filters }) => {
  const [pagination, setPagination] = useState({ limit: 20 });
  const [cancelWarningVisible, setCancelWarningVisible] = useState(false);
  const [userData, setUserData] = useState({});
  const intl = useIntl();
  const dispatch = useDispatch();
  const { push } = useHistory();

  const onSubmit = (formData) => {
    const groups = formData.groups;
    push({
      state: {
        username: user,
      },
      pathname: `/users/detail/${user}`,
      search: createQueryParams({ page: 1, per_page: pagination.limit }),
    });
    groups.forEach((group) => {
      dispatch(addMembersToGroup(group.uuid, [{ username: user }]));
    });
  };

  const onCancel = (formData) => {
    setUserData(formData);
    if (Object.keys(formData).length > 0) {
      setCancelWarningVisible(true);
    } else {
      redirectToUser();
    }
  };
  const redirectToUser = () => {
    dispatch(
      addNotification({
        variant: 'warning',
        title: intl.formatMessage(messages.addingGroupMemberCancelled),
        dismissDelay: 8000,
        description: intl.formatMessage(messages.addingGroupMemberDescription),
      })
    );
    push({
      pathname: `/users/detail/${user}`,
      search: createQueryParams({ page: 1, ...filters }),
    });
  };
  const schema = {
    fields: [
      {
        name: 'groups',
        label: 'Select groups',
        component: 'group-table',
        user,
      },
    ],
  };

  return cancelWarningVisible ? (
    <WarningModal type="user" isOpen={cancelWarningVisible} onModalCancel={() => setCancelWarningVisible(false)} onConfirmCancel={redirectToUser} />
  ) : (
    <FormRenderer schema={schema} componentMapper={componentMapper} onSubmit={onSubmit} onCancel={onCancel} initialValues={userData}>
      <ModalFormTemplate user={user} onCancel={onCancel} />
    </FormRenderer>
  );
};

AddUserToAGroupWizard.propTypes = {
  user: PropTypes.string,
  filters: PropTypes.object.isRequired,
};

export default AddUserToAGroupWizard;
