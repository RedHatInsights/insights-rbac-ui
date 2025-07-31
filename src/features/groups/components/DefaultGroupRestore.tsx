import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Popover, PopoverPosition } from '@patternfly/react-core/dist/dynamic/components/Popover';
import OutlinedQuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/outlined-question-circle-icon';
import { FormattedMessage, useIntl } from 'react-intl';
import messages from '../../../Messages';

interface DefaultGroupRestoreProps {
  onRestore: () => void;
}

export const DefaultGroupRestore: React.FC<DefaultGroupRestoreProps> = ({ onRestore }) => {
  const intl = useIntl();

  return (
    <div className="rbac-default-group-reset-btn">
      <Button variant="link" onClick={onRestore}>
        {intl.formatMessage(messages.restoreToDefault)}
      </Button>
      <Popover
        aria-label="default-group-icon"
        position={PopoverPosition.bottomEnd}
        bodyContent={
          <FormattedMessage
            {...messages.restoreDefaultAccessInfo}
            values={{
              b: (text) => <b>{text}</b>,
            }}
          />
        }
      >
        <Button variant="plain" aria-label="More information about restoring default access">
          <OutlinedQuestionCircleIcon className="rbac-default-group-info-icon pf-v5-u-mt-sm" />
        </Button>
      </Popover>
    </div>
  );
};
