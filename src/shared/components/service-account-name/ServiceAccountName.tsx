import React from 'react';
import { Label } from '@patternfly/react-core/dist/dynamic/components/Label';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

interface ServiceAccountNameProps {
  name: string;
  serviceAccountType?: string;
  satEnabled: boolean;
}

export function ServiceAccountName({ name, serviceAccountType, satEnabled }: ServiceAccountNameProps) {
  const intl = useIntl();
  return (
    <>
      {name}
      {satEnabled && serviceAccountType === 'service_access_token' && (
        <Label color="blue" className="pf-v6-u-ml-sm">
          {intl.formatMessage(messages.serviceAccessTokenLabel)}
        </Label>
      )}
    </>
  );
}
