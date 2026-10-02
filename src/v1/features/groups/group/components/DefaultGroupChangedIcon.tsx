import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Popover } from '@patternfly/react-core/dist/dynamic/components/Popover';
import OutlinedQuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/outlined-question-circle-icon';
import { FormattedMessage } from 'react-intl';

interface DefaultGroupChangedIconProps {
  name: string;
}

export const DefaultGroupChangedIcon: React.FC<DefaultGroupChangedIconProps> = ({ name }) => {
  return (
    <div style={{ display: 'inline-flex' }}>
      <div style={{ alignSelf: 'center' }}>{name}</div>
      <Popover
        aria-label="default-group-icon"
        bodyContent={
          <FormattedMessage
            id={'defaultAccessGroupNameChanged'}
            defaultMessage={
              'Now that you have edited the <b>Default access</b> group, the system will no longer update it with new default access roles. The group name has changed to <b>Custom default access</b>.'
            }
            description={'Default access group renamed message'}
            values={{
              b: (text) => <b>{text}</b>,
            }}
          />
        }
      >
        <Button
          icon={<OutlinedQuestionCircleIcon className="rbac-default-group-info-icon" />}
          variant="plain"
          aria-label="More information about default group changes"
        />
      </Popover>
    </div>
  );
};
