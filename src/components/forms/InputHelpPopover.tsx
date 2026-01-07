import React, { ReactNode } from 'react';
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Popover } from '@patternfly/react-core/dist/dynamic/components/Popover';

interface InputHelpPopoverProps {
  headerContent?: ReactNode;
  bodyContent?: ReactNode;
  field?: string;
}

const InputHelpPopover: React.FC<InputHelpPopoverProps> = ({ headerContent = null, bodyContent = null, field = 'input' }) => (
  <Popover headerContent={headerContent} bodyContent={bodyContent}>
    <Button
      icon={<HelpIcon />}
      variant="plain"
      aria-label={`More info for ${field}`}
      onClick={(e) => e.preventDefault()}
      aria-describedby="form-name"
      className="pf-v6-c-form__group-label-help"
    />
  </Popover>
);

export default InputHelpPopover;
