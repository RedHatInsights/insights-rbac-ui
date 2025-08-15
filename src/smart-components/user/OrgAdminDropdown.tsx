import { Dropdown, DropdownItem, DropdownList, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
import React, { useEffect, useState } from 'react';
import { IntlShape } from 'react-intl';
import messages from '../../Messages';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { useDispatch } from 'react-redux';
import { updateUserIsOrgAdminStatus } from '../../redux/actions/user-actions';

const OrgAdminDropdown: React.FC<{
  isOrgAdmin: boolean;
  username: string;
  intl: IntlShape;
  userId: number | undefined;
  fetchData?: () => void;
}> = ({ isOrgAdmin, username, intl, userId, fetchData }) => {
  const { auth, isProd } = useChrome();
  const [isOpen, setIsOpen] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountUsername, setAccountUsername] = useState<string | null>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const getToken = async () => {
      setAccountId((await auth.getUser())?.identity?.org_id as string);
      setAccountUsername((await auth.getUser())?.identity?.user?.username as string);
      setToken((await auth.getToken()) as string);
    };
    getToken();
  }, [auth]);

  useEffect(() => {
    if (accountUsername === username) {
      setIsDisabled(true);
    }
  }, [username, accountUsername]);

  const onToggleClick = () => {
    setIsOpen((prev) => !prev);
  };

  const onSelect = async (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
    if (loading) return;

    const newStatus = value === 'true';
    if (newStatus === isOrgAdmin) return;

    setLoading(true);

    try {
      await dispatch(updateUserIsOrgAdminStatus({ id: userId, is_org_admin: newStatus }, { isProd: isProd(), token, accountId }));
      fetchData?.();
    } catch (error) {
      console.error('Failed to update org admin status:', error);
    } finally {
      setLoading(false);
    }

    setIsOpen(false);
  };

  return (
    <Dropdown
      isOpen={isOpen}
      onSelect={onSelect}
      onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle ref={toggleRef} onClick={onToggleClick} isExpanded={isOpen} isDisabled={isDisabled}>
          {isOrgAdmin ? intl.formatMessage(messages.yes) : intl.formatMessage(messages.no)}
        </MenuToggle>
      )}
      ouiaId="OrgAdminDropdown"
      shouldFocusToggleOnSelect
    >
      <DropdownList>
        <DropdownItem value="true" key="yes">
          {intl.formatMessage(messages.yes)}
        </DropdownItem>
        <DropdownItem value="false" key="no">
          {intl.formatMessage(messages.no)}
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
};

export default OrgAdminDropdown;
