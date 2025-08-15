import * as ActionTypes from '../action-types';
import * as PolicyHelper from '../../helpers/policy/policy-helper';
import { createIntl, createIntlCache } from 'react-intl';
import messages from '../../Messages';
import providerMessages from '../../locales/data.json';

import { locale } from '../../locales/locale';

export const fetchGroupPolicies = (options = {}) => ({
  type: ActionTypes.FETCH_GROUP_POLICIES,
  payload: PolicyHelper.fetchGroupPolicies(options),
});

export const fetchPolicy = (apiProps) => ({
  type: ActionTypes.FETCH_POLICY,
  payload: PolicyHelper.fetchPolicy(apiProps),
});

export const createPolicy = (policyData) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages }, cache);
  return {
    type: ActionTypes.ADD_POLICY,
    payload: PolicyHelper.createPolicy(policyData),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(messages.addPolicySuccessTitle),
          dismissDelay: 8000,
          description: intl.formatMessage(messages.addPolicySuccessDescription),
        },
        rejected: {
          variant: 'danger',
          title: intl.formatMessage(messages.addPolicyErrorTitle),
          dismissDelay: 8000,
          description: intl.formatMessage(messages.addPolicyErrorDescription),
        },
      },
    },
  };
};

export const removePolicy = (policy) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages }, cache);
  return {
    type: ActionTypes.REMOVE_POLICY,
    payload: PolicyHelper.removePolicy(policy),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(messages.removePolicySuccessTitle),
          dismissDelay: 8000,
          description: intl.formatMessage(messages.removePolicySuccessDescription),
        },
      },
    },
  };
};

export const updatePolicy = (uuid, policyData) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages }, cache);
  return {
    type: ActionTypes.UPDATE_POLICY,
    payload: PolicyHelper.updatePolicy(uuid, policyData),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(messages.editPolicySuccessTitle),
          dismissDelay: 8000,
          description: intl.formatMessage(messages.editPolicySuccessDescription),
        },
        rejected: {
          variant: 'danger',
          title: intl.formatMessage(messages.editPolicyErrorTitle),
          dismissDelay: 8000,
          description: intl.formatMessage(messages.editPolicyErrorDescription),
        },
      },
    },
  };
};
