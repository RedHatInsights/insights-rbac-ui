import React from 'react';
import { ModalFormTemplate } from '../../components/forms/ModalFormTemplate';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import messages from '../../Messages';
import './role/legacy/role-permissions.scss';

const ResourceDefinitionsFormTemplate = ({ ModalProps, ...props }) => {
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
                <Alert className="pf-v5-c-modal__alert" variant="danger" isInline title={intl.formatMessage(messages.defineAtLeastOneResource)} />
              </div>
            )
      }
    />
  );
};

ResourceDefinitionsFormTemplate.propTypes = {
  ModalProps: PropTypes.object,
};

export default ResourceDefinitionsFormTemplate;
