import React, { ReactNode } from 'react';
import { HelpIcon } from '@patternfly/react-icons';
import { Button, Popover } from '@patternfly/react-core';

interface InputHelpPopoverProps {
  headerContent?: ReactNode;
  bodyContent?: ReactNode;
  field?: string;
}

const InputHelpPopover: React.FC<InputHelpPopoverProps> = ({ headerContent = null, bodyContent = null, field = 'input' }) => (
  <Popover headerContent={headerContent} bodyContent={bodyContent}>
    <Button
      variant="plain"
      aria-label={`More info for ${field}`}
      onClick={(e) => e.preventDefault()}
      aria-describedby="form-name"
      className="pf-v5-c-form__group-label-help"
    >
      <HelpIcon />
    </Button>
  </Popover>
);

export default InputHelpPopover;
