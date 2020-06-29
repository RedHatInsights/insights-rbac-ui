import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@patternfly/react-core';
import { isEmpty } from 'lodash';
import useFormApi from '@data-driven-forms/react-form-renderer/dist/cjs/use-form-api';
import FormSpy from '@data-driven-forms/react-form-renderer/dist/cjs/form-spy';
import { ActionGroup } from '@patternfly/react-core';
import './formButtons.scss';

const FormButtons = ({ dirtyFieldsSinceLastSubmit, submitSucceeded, pristine }) => {
    const { onCancel } = useFormApi();
    const noChanges = isEmpty(dirtyFieldsSinceLastSubmit) || !submitSucceeded && pristine;
    return (<ActionGroup className="ins-m__action-group">
        <Button
            type="submit"
            isDisabled={ noChanges }
            variant="primary">Submit</Button>
        <Button
            variant="link"
            onClick={ () => onCancel() }>
            Cancel
        </Button>
    </ActionGroup>
    );
};

FormButtons.propTypes = {
    dirtyFieldsSinceLastSubmit: PropTypes.arrayOf(PropTypes.shape({
        [PropTypes.string]: PropTypes.oneOfType([ PropTypes.string, PropTypes.number, PropTypes.bool ])
    })),
    submitSucceeded: PropTypes.bool,
    pristine: PropTypes.bool,
    onCancel: PropTypes.func
};

const FormButtonWithSpies = (formProps) => (
    <FormSpy subscription={ {
        pristine: true,
        submitSucceeded: true,
        dirtyFieldsSinceLastSubmit: true
    } }>
        { (props) => <FormButtons { ...props } { ...formProps }/> }
    </FormSpy>
);

export default FormButtonWithSpies;
