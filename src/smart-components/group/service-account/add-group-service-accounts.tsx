import React, { Fragment, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Button, Modal, ModalVariant, Stack, StackItem, TextContent } from '@patternfly/react-core';
import { useParams } from 'react-router-dom';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import AppLink from '../../../presentational-components/shared/AppLink';
import useAppNavigate from '../../../hooks/useAppNavigate';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { fetchServiceAccounts } from '../../../redux/actions/service-account-actions';
import { ServiceAccountsState } from '../../../redux/reducers/service-account-reducer';
import { getDateFormat } from '../../../helpers/shared/helpers';
import { RowProps } from '../../user/user-table-helpers';
import { LAST_PAGE, ServiceAccount } from '../../../helpers/service-account/service-account-helper';
import { DEFAULT_ACCESS_GROUP_ID } from '../../../utilities/constants';
import { addServiceAccountsToGroup } from '../../../redux/actions/group-actions';
import messages from '../../../Messages';
import './group-service-accounts.scss';

interface AddGroupServiceAccountsProps {
  submitRoute: string;
  cancelRoute: string;
}

export interface PaginationProps {
  count?: number;
  limit: number;
  offset: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const reducer = ({ serviceAccountReducer, groupReducer: { systemGroup } }: { serviceAccountReducer: ServiceAccountsState; groupReducer: any }) => ({
  serviceAccounts: serviceAccountReducer.serviceAccounts,
  status: serviceAccountReducer.status,
  isLoading: serviceAccountReducer.isLoading,
  limit: serviceAccountReducer.limit,
  offset: serviceAccountReducer.offset,
  systemGroupUuid: systemGroup?.uuid,
});

const createRows = (data: ServiceAccount[], checkedRows = []) =>
  data?.reduce(
    (acc: unknown[], curr: ServiceAccount) => [
      ...acc,
      {
        uuid: curr.uuid,
        title: curr.name,
        cells: [
          curr.name,
          curr.clientId,
          curr.createdBy,
          <Fragment key={`${curr.name}-modified`}>
            <DateFormat date={curr.createdAt} type={getDateFormat(curr.createdAt)} />
          </Fragment>,
        ],
        selected: Boolean(checkedRows && checkedRows.find((row: RowProps) => row.uuid === curr.uuid)),
      },
    ],
    []
  );

const AddGroupServiceAccounts: React.FunctionComponent<AddGroupServiceAccountsProps> = ({
  submitRoute,
  cancelRoute,
}: AddGroupServiceAccountsProps) => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const dispatch = useDispatch();
  const { groupId } = useParams();
  const { auth, getEnvironmentDetails } = useChrome();
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const { serviceAccounts, status, limit, offset, isLoading, systemGroupUuid } = useSelector(reducer);

  const fetchAccounts = async (props?: PaginationProps) => {
    const env = getEnvironmentDetails();
    const token = await auth.getToken();
    dispatch(fetchServiceAccounts({ limit: props?.limit ?? limit, offset: props?.offset ?? offset, token, sso: env?.sso }));
  };

  useEffect(() => {
    fetchAccounts({ limit, offset: 0 });
  }, []);

  const onCancel = () => navigate(submitRoute);

  const onSubmit = () => {
    dispatch(addServiceAccountsToGroup(groupId === DEFAULT_ACCESS_GROUP_ID ? systemGroupUuid : groupId, selectedAccounts));
    navigate(cancelRoute);
  };

  const columns = [
    { title: intl.formatMessage(messages.description), orderBy: 'description' },
    { title: intl.formatMessage(messages.clientId), orderBy: 'clientId' },
    { title: intl.formatMessage(messages.owner), orderBy: 'owner' },
    { title: intl.formatMessage(messages.timeCreated), orderBy: 'timeCreated' },
  ];

  return (
    <Modal
      isOpen
      className="rbac"
      variant={ModalVariant.medium}
      title={intl.formatMessage(messages.addServiceAccount)}
      actions={[
        <Button key="confirm" ouiaId="primary-confirm-button" isDisabled={selectedAccounts.length === 0} variant="primary" onClick={onSubmit}>
          {intl.formatMessage(messages.addToGroup)}
        </Button>,
        <Button ouiaId="secondary-cancel-button" key="cancel" variant="link" onClick={onCancel}>
          {intl.formatMessage(messages.cancel)}
        </Button>,
      ]}
      onClose={onCancel}
    >
      <Stack hasGutter>
        <StackItem>
          <TextContent>
            {intl.formatMessage(messages.addServiceAccountsToGroupDescription)}
            <Alert
              className="pf-u-mt-sm rbac-service-accounts-alert"
              variant="info"
              component="span"
              isInline
              isPlain
              title={intl.formatMessage(messages.visitServiceAccountsPage, {
                link: (
                  <AppLink to="/service-accounts" linkBasename="/iam">
                    {intl.formatMessage(messages.serviceAccountsPage)}
                  </AppLink>
                ),
              })}
            />
          </TextContent>
        </StackItem>
        <StackItem className="rbac-add-service-account-modal">
          <TableToolbarView
            columns={columns}
            isSelectable
            rows={createRows(serviceAccounts, selectedAccounts)}
            data={serviceAccounts}
            fetchData={fetchAccounts}
            isLoading={isLoading}
            pagination={{
              limit,
              offset,
              ...(status === LAST_PAGE ? { count: offset + serviceAccounts.length } : {}),
            }}
            paginationToggleTemplate={({ firstIndex, lastIndex }) => (
              <>
                <b>
                  {firstIndex} - {lastIndex}
                </b>{' '}
                of <b>many</b>
              </>
            )}
            checkedRows={selectedAccounts}
            setCheckedItems={setSelectedAccounts}
            titlePlural={intl.formatMessage(messages.serviceAccounts).toLowerCase()}
            titleSingular={intl.formatMessage(messages.serviceAccount)}
            emptyProps={{
              title: intl.formatMessage(messages.noServiceAccountsFound),
              description: [intl.formatMessage(messages.contactServiceTeamForAccounts), ''],
            }}
            tableId="group-add-accounts"
            ouiaId="group-add-accounts"
          />
        </StackItem>
      </Stack>
    </Modal>
  );
};

export default AddGroupServiceAccounts;
