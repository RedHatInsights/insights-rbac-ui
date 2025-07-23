import React, { useContext, useEffect, useState } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import { Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core/deprecated';

import { PageHeaderTitle } from '@redhat-cloud-services/frontend-components/PageHeader';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { Spinner, Text } from '@patternfly/react-core';
import StatusLabel from '../../presentational-components/myUserAccess/StatusLabel';
import PermissionsContext from '../../utilities/permissions-context';
import { bundleData } from '../../presentational-components/myUserAccess/bundles';
import MUAContent from './MUAContent';
import { DEFAULT_MUA_BUNDLE } from '../../utilities/constants';
import { useIntl } from 'react-intl';
import messages from '../../Messages';
import './MUAHome.scss';

const MyUserAccess = () => {
  const intl = useIntl();
  const chrome = useChrome();
  const [user, setUser] = useState({});
  const [{ bundle }, setSearchParams] = useSearchParams();
  const [bundleParam, setBundleParam] = useState(bundle);
  const { userAccessAdministrator } = useContext(PermissionsContext);
  useEffect(() => {
    chrome.auth.getUser().then(({ identity, entitlements }) =>
      setUser({
        entitlements,
        isOrgAdmin: identity?.user?.is_org_admin,
      }),
    );
    !bundle && setSearchParams({ bundle: DEFAULT_MUA_BUNDLE });
  }, []);
  const enhancedEntitlements = {
    ...user.entitlements,
  };

  const entitledBundles = Object.entries(enhancedEntitlements).filter(([, { is_entitled }]) => is_entitled);

  const [isDropdownOpen, setDropdownOpen] = useState(false);

  return (
    <React.Fragment>
      {Object.prototype.hasOwnProperty.call(user, 'entitlements') &&
      (Object.prototype.hasOwnProperty.call(user, 'isOrgAdmin') || userAccessAdministrator) ? (
        <React.Fragment>
          <PageHeaderTitle
            className="rbac-p-myUserAccess--title sticky"
            title={
              <React.Fragment>
                <span> {intl.formatMessage(messages.myUserAccess)} </span>
                <StatusLabel isOrgAdmin={user.isOrgAdmin} isUserAccessAdmin={userAccessAdministrator} />
              </React.Fragment>
            }
          />
          <Text component="p" className="rbac-p-myUserAccess--subtitle">
            {intl.formatMessage(messages.selectAppsToViewPermissions)}
          </Text>
          {entitledBundles && (
            <div className="rbac-p-myUserAccess--dropdown sticky">
              <Dropdown
                ouiaId="mua-bundle-dropdown"
                toggle={
                  <DropdownToggle onToggle={() => setDropdownOpen(!isDropdownOpen)} id="mua-bundle-dropdown">
                    {bundleParam ? bundleParam : intl.formatMessage(messages.chooseSubscriptionEllipsis)}
                  </DropdownToggle>
                }
                dropdownItems={bundleData.map((data) => (
                  <NavLink key={data.entitlement} to={{ pathname: '', search: `bundle=${data.entitlement}` }}>
                    <DropdownItem
                      onClick={() => {
                        setBundleParam(data.title);
                        setDropdownOpen(false);
                      }}
                      component="button"
                    >
                      {data.title}
                    </DropdownItem>
                  </NavLink>
                ))}
                isOpen={isDropdownOpen}
              />
            </div>
          )}
          <section>
            <MUAContent entitlements={enhancedEntitlements} isOrgAdmin={user.isOrgAdmin} isUserAccessAdmin={true} />
          </section>
        </React.Fragment>
      ) : (
        <Spinner />
      )}
    </React.Fragment>
  );
};

export default MyUserAccess;
