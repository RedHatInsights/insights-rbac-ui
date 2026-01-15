import React from 'react';
import { ModalFormTemplate } from '../../components/forms/ModalFormTemplate';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { useIntl } from 'react-intl';
import messages from '../../Messages';

interface ModalProps {
  onClose: (values: Record<string, unknown>) => void;
  [key: string]: unknown;
}

interface ResourceDefinitionsFormTemplateProps {
  ModalProps: ModalProps;
  [key: string]: unknown;
}

const ResourceDefinitionsFormTemplate: React.FC<ResourceDefinitionsFormTemplateProps> = ({ ModalProps, ...props }) => {
  const intl = useIntl();
  const formOptions = useFormApi();
  const values = formOptions.getState().values;

  return (
    <ModalFormTemplate
      {...props}
      ModalProps={{
        ...ModalProps,
        onClose: () => ModalProps.onClose(values),
      }}
      alert={
        values['dual-list-select']
          ? undefined
          : () => (
              <div className="rbac-m-resource-definitions">
                <Alert className="pf-v6-c-modal__alert" variant="danger" isInline title={intl.formatMessage(messages.defineAtLeastOneResource)} />
              </div>
            )
      }
    />
  );
};

export default ResourceDefinitionsFormTemplate;
