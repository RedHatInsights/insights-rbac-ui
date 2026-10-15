import React from 'react';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { Popover } from '@patternfly/react-core/dist/dynamic/components/Popover';
import OutlinedQuestionCircleIcon from '@patternfly/react-icons/dist/dynamic/icons/outlined-question-circle-icon';
import { useIntl } from 'react-intl';
import messages from '../../../../Messages';

/**
 * Pre-conversion checklist step header component
 * The actual checkboxes are rendered by data-driven-forms from the schema
 */
export const PreConversionChecklistStep: React.FC = () => {
  const intl = useIntl();

  return (
    <div>
      <Title headingLevel="h2" size="xl">
        {intl.formatMessage(messages.conversionWizardPreConversionChecklistTitle)}
      </Title>

      <Content component="p" className="pf-v6-u-mt-md pf-v6-u-mb-md">
        {intl.formatMessage(messages.conversionWizardPreConversionChecklistDescription)}
        <Popover
          aria-label={intl.formatMessage(messages.conversionWizardChecklistPopoverAriaLabel)}
          bodyContent={intl.formatMessage(messages.conversionWizardPreConversionChecklistPopover)}
        >
          <button
            type="button"
            aria-label={intl.formatMessage(messages.conversionWizardChecklistPopoverButtonAriaLabel)}
            onClick={(e) => e.preventDefault()}
            className="pf-v6-c-button pf-m-plain pf-v6-u-pl-sm"
          >
            <OutlinedQuestionCircleIcon />
          </button>
        </Popover>
      </Content>
    </div>
  );
};
