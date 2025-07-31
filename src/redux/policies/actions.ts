import { ADD_POLICY, FETCH_GROUP_POLICIES, FETCH_POLICY, REMOVE_POLICY, UPDATE_POLICY } from './action-types';
import {
  FetchGroupPoliciesParams,
  createPolicy as createPolicyHelper,
  fetchGroupPolicies as fetchGroupPoliciesHelper,
  fetchPolicy as fetchPolicyHelper,
  removePolicy as removePolicyHelper,
  updatePolicy as updatePolicyHelper,
} from './helper';
import { createIntl, createIntlCache } from 'react-intl';
import messages from '../../Messages';
import providerMessages from '../../locales/data.json';
import { locale } from '../../locales/locale';
import { PolicyIn } from '@redhat-cloud-services/rbac-client/types';

export const fetchGroupPolicies = (options: FetchGroupPoliciesParams = {}) => ({
  type: FETCH_GROUP_POLICIES,
  payload: fetchGroupPoliciesHelper(options),
});

export const fetchPolicy = (uuid: string) => ({
  type: FETCH_POLICY,
  payload: fetchPolicyHelper(uuid),
});

export const createPolicy = (policyData: PolicyIn) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages[locale] }, cache);
  return {
    type: ADD_POLICY,
    payload: createPolicyHelper(policyData),
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

export const removePolicy = (uuid: string) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages[locale] }, cache);
  return {
    type: REMOVE_POLICY,
    payload: removePolicyHelper(uuid),
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

export const updatePolicy = (uuid: string, policyData: PolicyIn) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages[locale] }, cache);
  return {
    type: UPDATE_POLICY,
    payload: updatePolicyHelper(uuid, policyData),
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
