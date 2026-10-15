import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { EmptyState, EmptyStateActions, EmptyStateBody, EmptyStateFooter } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { Modal, ModalBody, ModalVariant } from '@patternfly/react-core/dist/dynamic/components/Modal';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import CheckCircleIcon from '@patternfly/react-icons/dist/js/icons/check-circle-icon';
import ExclamationTriangleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-triangle-icon';
import messages from '../../../../../Messages';
import { getModalContainer } from '../../../../../shared/helpers/modal-container';
import { CONSECUTIVE_SUCCESS_THRESHOLD, useWorkspaceAccessSnapshot, useWorkspaceReadyPoll } from '../hooks/useWorkspaceReadyCheck';

export interface WaitForWorkspaceReadyProps {
  workspace: { id: string; name: string };
  onFinish: () => void;
  onClose: () => void;
}

/**
 * Inner component that calls the Kessel SDK hook. Remounted via React key
 * each poll interval so the SDK hook fires a fresh /checkselfbulk request.
 */
const PermissionChecker: React.FC<{
  workspaceId: string;
  onResult: (allAllowed: boolean) => void;
  onComplete: () => void;
}> = ({ workspaceId, onResult, onComplete }) => {
  const { allAllowed, loading } = useWorkspaceAccessSnapshot(workspaceId);

  useEffect(() => {
    if (!loading) {
      onResult(allAllowed);
      onComplete();
    }
  }, [allAllowed, loading, onResult, onComplete]);

  return null;
};

/**
 * Post-submit progress modal for workspace creation.
 *
 * Polls Kessel access checks (via the SDK's useSelfAccessCheck) until all
 * workspace permissions (view, edit, delete, create, move) are propagated
 * to SpiceDB. The SDK hook doesn't support polling natively, so we remount
 * the PermissionChecker component on an interval via a changing React key.
 *
 * Three visual states:
 * - Polling: spinner with progress message
 * - Ready: success icon with "Close" button
 * - Timeout: warning with a "Close" escape hatch
 */
export const WaitForWorkspaceReady: React.FC<WaitForWorkspaceReadyProps> = ({ workspace, onFinish, onClose }) => {
  const intl = useIntl();
  const consecutiveCount = useRef(0);
  const [isReady, setIsReady] = useState(false);
  const { pollKey, timedOut, markCheckComplete } = useWorkspaceReadyPoll(isReady);

  const handleResult = useCallback((allAllowed: boolean) => {
    if (allAllowed) {
      consecutiveCount.current += 1;
      if (consecutiveCount.current >= CONSECUTIVE_SUCCESS_THRESHOLD) {
        setIsReady(true);
      }
    } else {
      consecutiveCount.current = 0;
    }
  }, []);

  const noop = () => {};
  const modalCloseHandler = isReady ? onFinish : timedOut ? onClose : noop;

  return (
    <Modal
      variant={ModalVariant.small}
      isOpen
      onClose={modalCloseHandler}
      appendTo={getModalContainer()}
      aria-label={intl.formatMessage(messages.createWorkspaceProgressTitle)}
    >
      <ModalBody>
        {!isReady && !timedOut && (
          <PermissionChecker key={pollKey} workspaceId={workspace.id} onResult={handleResult} onComplete={markCheckComplete} />
        )}

        {!isReady && !timedOut && (
          <EmptyState headingLevel="h4" icon={Spinner} titleText={intl.formatMessage(messages.createWorkspaceProgressTitle)}>
            <EmptyStateBody>{intl.formatMessage(messages.createWorkspaceProgressBody, { name: workspace.name })}</EmptyStateBody>
          </EmptyState>
        )}

        {isReady && (
          <EmptyState headingLevel="h4" icon={CheckCircleIcon} titleText={intl.formatMessage(messages.createWorkspaceReadyTitle)} status="success">
            <EmptyStateBody>{intl.formatMessage(messages.createWorkspaceReadyBody, { name: workspace.name })}</EmptyStateBody>
            <EmptyStateFooter>
              <EmptyStateActions>
                <Button variant="primary" onClick={onFinish}>
                  {intl.formatMessage(messages.close)}
                </Button>
              </EmptyStateActions>
            </EmptyStateFooter>
          </EmptyState>
        )}

        {timedOut && (
          <EmptyState
            headingLevel="h4"
            icon={ExclamationTriangleIcon}
            titleText={intl.formatMessage(messages.createWorkspaceTimeoutTitle)}
            status="warning"
          >
            <EmptyStateBody>{intl.formatMessage(messages.createWorkspaceTimeoutBody, { name: workspace.name })}</EmptyStateBody>
            <EmptyStateFooter>
              <EmptyStateActions>
                <Button variant="primary" onClick={onClose}>
                  {intl.formatMessage(messages.close)}
                </Button>
              </EmptyStateActions>
            </EmptyStateFooter>
          </EmptyState>
        )}
      </ModalBody>
    </Modal>
  );
};
