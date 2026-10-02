import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Popover, PopoverPosition } from '@patternfly/react-core/dist/dynamic/components/Popover';
import OutlinedQuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/outlined-question-circle-icon';
import { FormattedMessage, useIntl } from 'react-intl';

interface DefaultGroupRestoreProps {
  onRestore: () => void;
}

export const DefaultGroupRestore: React.FC<DefaultGroupRestoreProps> = ({ onRestore }) => {
  const intl = useIntl();

  return (
    <div className="rbac-default-group-reset-btn">
      <Button variant="link" onClick={onRestore}>
        {intl.formatMessage({ id: 'restoreToDefault', defaultMessage: 'Restore to default', description: 'Restore to default label' })}
      </Button>
      <Popover
        aria-label="default-group-icon"
        position={PopoverPosition.bottomEnd}
        bodyContent={
          <FormattedMessage
            id={'restoreDefaultAccessInfo'}
            defaultMessage={
              'This restores <b>Default access</b> group and removes <b>Custom default access</b> group. All configurations in <b>Custom default access</b> are deleted and cannot be recovered.'
            }
            description={'Restore Custom Default Access group info'}
            values={{
              b: (text) => <b>{text}</b>,
            }}
          />
        }
      >
        <Button
          icon={<OutlinedQuestionCircleIcon className="rbac-default-group-info-icon pf-v6-u-mt-sm" />}
          variant="plain"
          aria-label="More information about restoring default access"
        />
      </Popover>
    </div>
  );
};
