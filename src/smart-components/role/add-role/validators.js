import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { fetchRoles } from '../../../helpers/role/role-helper';
import asyncDebounce from '../../../utilities/async-debounce';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { createIntl, createIntlCache } from 'react-intl';
import messages from '../../../Messages';
import providerMessages from '../../../locales/data.json';
import { locale } from '../../../locales/locale';

export const asyncValidator = async (roleName) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages }, cache);
  if (!roleName) {
    return undefined;
  }

  const response = await fetchRoles({ limit: 10, offset: 0, name: roleName, nameMatch: 'exact' }).catch((error) => {
    console.error(error);
    return undefined;
  });

  // it has to be here twice because API is using AND instead of OR
  const responseName = await fetchRoles({
    limit: 10,
    offset: 0,
    displayName: roleName,
    nameMatch: 'exact',
  }).catch((error) => {
    console.error(error);
    return undefined;
  });

  if (response?.data?.length > 0 || responseName?.data?.length > 0) {
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

ValidatorReset.propTypes = {
  name: PropTypes.string.isRequired,
};
