import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Popover } from '@patternfly/react-core/dist/dynamic/components/Popover';
import OutlinedQuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/outlined-question-circle-icon';
import { FormattedMessage } from 'react-intl';
import messages from '../../../../Messages';

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
            {...messages.defaultAccessGroupNameChanged}
            values={{
              b: (text) => <b>{text}</b>,
            }}
          />
        }
      >
        <Button variant="plain" aria-label="More information about default group changes">
          <OutlinedQuestionCircleIcon className="rbac-default-group-info-icon" />
        </Button>
      </Popover>
    </div>
  );
};
