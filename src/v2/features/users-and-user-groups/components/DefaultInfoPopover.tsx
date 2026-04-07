import { Popover } from '@patternfly/react-core/dist/dynamic/components/Popover';
import OutlinedQuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/outlined-question-circle-icon';
import React, { useRef } from 'react';

interface DefaultInfoPopoverProps {
  id: string;
  uuid: string;
  bodyContent: string;
}

/**
 * Info popover for default groups in the groups table.
 * Shows an info icon with explanatory text about inherited permissions.
 * Popover appears on hover (V2) instead of click (V1).
 */
export const DefaultInfoPopover: React.FC<DefaultInfoPopoverProps> = ({ id, uuid, bodyContent }) => {
  const popoverRootRef = useRef<HTMLSpanElement>(null);

  return (
    <span ref={popoverRootRef} key={`${uuid}-popover`} id={id}>
      <Popover zIndex={110} position="right" bodyContent={bodyContent} appendTo={popoverRootRef.current || undefined} triggerAction="hover">
        <OutlinedQuestionCircleIcon className="pf-v6-c-question-circle-icon" />
      </Popover>
    </span>
  );
};
