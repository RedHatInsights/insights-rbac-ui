import { Text, TextVariants } from '@patternfly/react-core/dist/dynamic/components/Text';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/dynamic/icons/external-link-alt-icon';
import React, { FunctionComponent } from 'react';
import { useIntl } from 'react-intl';
import messages from '../../Messages';

type ActiveUserAdminProps = {
  linkDescription?: string;
  linkTitle?: string;
  prefix: string;
  children?: React.ReactNode;
};

export const ActiveUsersAdminView: FunctionComponent<ActiveUserAdminProps> = ({
  linkDescription = '',
  linkTitle = ' user management list ',
  prefix,
  children,
}) => {
  const intl = useIntl();
  return (
    <>
      <Text className="pf-v5-u-mt-0" component={TextVariants.h6}>
        {`${intl.formatMessage(messages.usersDescription)} `}
        {linkDescription}
        <Text
          component={TextVariants.a}
          href={`https://www.${prefix}redhat.com/wapps/ugc/protected/usermgt/userList.html`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {linkTitle}
          <ExternalLinkAltIcon />
        </Text>
        .
      </Text>
      {children}
    </>
  );
};
