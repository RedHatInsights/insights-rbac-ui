import React from 'react';
import { Card, CardBody } from '@patternfly/react-core/dist/dynamic/components/Card';
import { Bullseye } from '@patternfly/react-core/dist/dynamic/layouts/Bullseye';
import { Text, TextContent, TextVariants } from '@patternfly/react-core/dist/dynamic/components/Text';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

interface DefaultServiceAccountsCardProps {
  isPlatformDefault: boolean;
}

export const DefaultServiceAccountsCard: React.FC<DefaultServiceAccountsCardProps> = ({ isPlatformDefault }) => {
  const intl = useIntl();

  return (
    <Card>
      <CardBody>
        <Bullseye>
          <TextContent>
            <Text component={TextVariants.h1}>
              {intl.formatMessage(isPlatformDefault ? messages.noAccountsInDefaultAccess : messages.noAccountsInDefaultAdminAccess)}
            </Text>
          </TextContent>
        </Bullseye>
      </CardBody>
    </Card>
  );
};
