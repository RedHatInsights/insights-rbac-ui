import React from 'react';
import { useFormApi } from '@data-driven-forms/react-form-renderer';
import useFieldApi, { UseFieldApiConfig } from '@data-driven-forms/react-form-renderer/use-field-api';
import { Checkbox } from '@patternfly/react-core/dist/dynamic/components/Checkbox';
import { ExpandableSection } from '@patternfly/react-core/dist/dynamic/components/ExpandableSection';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Radio } from '@patternfly/react-core/dist/dynamic/components/Radio';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';
import OutlinedQuestionCircleIcon from '@patternfly/react-icons/dist/dynamic/icons/outlined-question-circle-icon';

export type ExpandableCheckboxItemType = {
  title: string;
  description: string;
  name: string;
  options?: { title: string; description: string; name: string }[];
};

const ExpandableCheckbox: React.FC<UseFieldApiConfig> = (props) => {
  const formOptions = useFormApi();
  const { items, input } = useFieldApi(props);
  const values = formOptions.getState().values;
  return (
    <FormGroup>
      {items?.map((item: ExpandableCheckboxItemType, key: number) => (
        <Checkbox
          inputClassName="pf-v6-u-mt-xs"
          key={key}
          isChecked={!!values[input.name]?.[item.name]}
          onChange={(_e, value) => {
            const newVal = value && item.options ? item.options?.[0]?.name : value;
            input.onChange({
              ...values[input.name],
              [item.name]: newVal,
            });
          }}
          label={
            <ExpandableSection toggleText={item.title} isIndented>
              {item.description}
              {item.options && (
                <FormGroup role="radiogroup" fieldId={`${item.name}-radiogroup`}>
                  {item.options?.map((option, key) => (
                    <Radio
                      key={key}
                      name={`${item.name}-radio`}
                      isChecked={values[input.name]?.[item.name] === option.name}
                      onChange={() => {
                        input.onChange({
                          ...values[input.name],
                          [item.name]: option.name,
                        });
                      }}
                      label={
                        <React.Fragment>
                          {option.title}{' '}
                          {option.description && (
                            <Tooltip content={option.description}>
                              <OutlinedQuestionCircleIcon />
                            </Tooltip>
                          )}
                        </React.Fragment>
                      }
                      id={`${item.name}-option-${key}`}
                    />
                  ))}
                </FormGroup>
              )}
            </ExpandableSection>
          }
          id={`${item.name}-checkbox`}
          name={item.name}
        />
      ))}
    </FormGroup>
  );
};

export default ExpandableCheckbox;
