import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Popover } from '@patternfly/react-core/dist/dynamic/components/Popover';
import OutlinedQuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/outlined-question-circle-icon';
import React, { useRef } from 'react';

interface DefaultInfoPopoverProps {
  id: string;
  uuid: string;
  bodyContent: string;
  ariaLabel: string;
}

/**
 * Info popover for default groups in the groups table.
 * Shows an info icon with explanatory text about inherited permissions.
 * Keyboard accessible with focus and click/enter support.
 */
export const DefaultInfoPopover: React.FC<DefaultInfoPopoverProps> = ({ id, uuid, bodyContent, ariaLabel }) => {
  const popoverRootRef = useRef<HTMLSpanElement>(null);

  return (
    <span ref={popoverRootRef} key={`${uuid}-popover`} id={id}>
      <Popover zIndex={110} position="right" bodyContent={bodyContent} appendTo={popoverRootRef.current || undefined}>
        <Button variant="plain" aria-label={ariaLabel}>
          <OutlinedQuestionCircleIcon className="pf-v6-c-question-circle-icon" />
        </Button>
      </Popover>
    </span>
  );
};
