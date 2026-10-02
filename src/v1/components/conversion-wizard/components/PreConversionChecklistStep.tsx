import React from 'react';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { Popover } from '@patternfly/react-core/dist/dynamic/components/Popover';
import OutlinedQuestionCircleIcon from '@patternfly/react-icons/dist/dynamic/icons/outlined-question-circle-icon';
import { useIntl } from 'react-intl';

/**
 * Pre-conversion checklist step header component
 * The actual checkboxes are rendered by data-driven-forms from the schema
 */
export const PreConversionChecklistStep: React.FC = () => {
  const intl = useIntl();

  return (
    <div>
      <Title headingLevel="h2" size="xl">
        {intl.formatMessage({
          id: 'conversionWizardPreConversionChecklistTitle',
          defaultMessage: 'Pre-conversion checklist',
          description: 'Pre-conversion checklist step title',
        })}
      </Title>

      <Content component="p" className="pf-v6-u-mt-md pf-v6-u-mb-md">
        {intl.formatMessage({
          id: 'conversionWizardPreConversionChecklistDescription',
          defaultMessage: 'Please complete the checklist to confirm you understand the changes that will be made during conversion.',
          description: 'Pre-conversion checklist step description',
        })}
        <Popover
          aria-label={intl.formatMessage({
            id: 'conversionWizardChecklistPopoverAriaLabel',
            defaultMessage: 'Checklist information',
            description: 'Aria label for checklist information popover',
          })}
          bodyContent={intl.formatMessage({
            id: 'conversionWizardPreConversionChecklistPopover',
            defaultMessage:
              'These items must be acknowledged before proceeding with conversion. This ensures you understand the impact and are prepared for the changes.',
            description: 'Pre-conversion checklist popover content',
          })}
        >
          <button
            type="button"
            aria-label={intl.formatMessage({
              id: 'conversionWizardChecklistPopoverButtonAriaLabel',
              defaultMessage: 'More info for checklist',
              description: 'Aria label for checklist information button',
            })}
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
