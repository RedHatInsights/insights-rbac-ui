import { useEffect } from 'react';
import { fetchRoles } from '../../../helpers/role/role-helper';
import asyncDebounce from '../../../utilities/async-debounce';
import useFormApi from '@data-driven-forms/react-form-renderer/dist/cjs/use-form-api';

const asyncValidator = async (groupName) => {
  if (!groupName) {
    return undefined;
  }

  const response = await fetchRoles({ limit: 10, offset: 0, name: groupName, nameMatch: 'exact' }).catch((error) => {
    console.error(error);
    return undefined;
  });

  if (response?.data?.length > 0) {
    throw 'Name has already been taken';
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
