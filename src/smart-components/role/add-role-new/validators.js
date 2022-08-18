import { useEffect } from 'react';
import { fetchRoles } from '../../../helpers/role/role-helper';
import asyncDebounce from '../../../utilities/async-debounce';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

export const asyncValidator = async (roleName) => {
  const intl = useIntl();
  if (!roleName) {
    return undefined;
  }

  const response = await fetchRoles({ limit: 10, offset: 0, name: roleName, nameMatch: 'exact' }).catch((error) => {
    console.error(error);
    return undefined;
  });

  if (response?.data?.length > 0) {
    throw intl.formatMessage(messages.nameAlreadyTaken);
  }

  return undefined;
};

export const debouncedAsyncValidator = asyncDebounce(asyncValidator);

export const ValidatorReset = ({ name }) => {
  const formOptions = useFormApi();

  useEffect(() => {
    setTimeout(() => formOptions.change(name, '1'));

    return () => formOptions.change(name, '');
  }, []);

  return null;
};
