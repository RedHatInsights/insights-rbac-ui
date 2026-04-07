import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Popover } from '@patternfly/react-core/dist/dynamic/components/Popover';
import OutlinedQuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/outlined-question-circle-icon';
import { FormattedMessage } from 'react-intl';
import messages from '../../../../Messages';

interface DefaultGroupChangedIconProps {
  name: string;
}

/**
 * Displays a group name with an info icon and popover for customized default groups.
 * The popover explains that the group has been customized from the Default access group
 * and the system will no longer automatically update it.
 */
export const DefaultGroupChangedIcon: React.FC<DefaultGroupChangedIconProps> = ({ name }) => {
  return (
    <div style={{ display: 'inline-flex' }}>
      <div style={{ alignSelf: 'center' }}>{name}</div>
      <Popover
        aria-label="default-group-icon"
        bodyContent={
          <FormattedMessage
            {...messages.defaultAccessGroupNameChanged}
            values={{
              b: (text: React.ReactNode) => <b>{text}</b>,
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
