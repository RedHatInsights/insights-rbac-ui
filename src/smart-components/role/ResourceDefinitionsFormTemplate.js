import React from 'react';
import ModalFormTemplate from '../common/ModalFormTemplate';
import { Alert } from '@patternfly/react-core';
import useFormApi from '@data-driven-forms/react-form-renderer/dist/esm/use-form-api';
import PropTypes from 'prop-types';
import './role-permissions.scss';

const ResourceDefinitionsFormTemplate = ({ ModalProps, ...props }) => {
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
              <div className="ins-m-resource-definitions">
                <Alert className="pf-c-modal__alert" variant="danger" isInline title="At least one resource must be defined for this permission" />
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
