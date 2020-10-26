import React from 'react';
import ModalFormTemplate from '../common/ModalFormTemplate';
import { Alert } from '@patternfly/react-core';
import useFormApi from '@data-driven-forms/react-form-renderer/dist/cjs/use-form-api';
import './role-permissions.scss';

const ResourceDefinitionsFormTemplate = (props) => {
  const formOptions = useFormApi();

  return (
    <ModalFormTemplate
      {...props}
      alert={
        !formOptions.getState().values['dual-list-select']
          ? () => (
              <div className="ins-m-resource-definitions">
                <Alert className="pf-c-modal__alert" variant="danger" isInline title="At least one resource must be defined for this permission" />
              </div>
            )
          : undefined
      }
    />
  );
};

export default ResourceDefinitionsFormTemplate;
