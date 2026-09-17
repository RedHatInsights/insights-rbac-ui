import { useEffect } from 'react';
import { useFormApi } from '@data-driven-forms/react-form-renderer';

/**
 * Component that validates the pre-conversion checklist
 * Updates a hidden field when all checkboxes are checked
 */
export const PreConversionChecklistValidator: React.FC = () => {
  const formApi = useFormApi();

  useEffect(() => {
    const unsubscribe = formApi.subscribe(
      ({ values }) => {
        const allChecked =
          values['checkbox-reviewed-config'] &&
          values['checkbox-understand-permanent'] &&
          values['checkbox-complete-post-conversion'] &&
          values['checkbox-understand-remediation'];

        // Update the hidden field that controls the Next button
        formApi.change('checklist-complete', allChecked);
      },
      { values: true },
    );

    return () => unsubscribe();
  }, [formApi]);

  return null;
};
