import * as ActionTypes from '../action-types';
import * as PolicyHelper from '../../helpers/policy/policy-helper';

export const fetchGroupPolicies = (options = {}) => ({
  type: ActionTypes.FETCH_GROUP_POLICIES,
  payload: PolicyHelper.fetchGroupPolicies(options)
});

export const fetchPolicy = apiProps => ({
  type: ActionTypes.FETCH_POLICY,
  payload: PolicyHelper.fetchPolicy(apiProps)
});

export const createPolicy = (policyData) => ({
  type: ActionTypes.ADD_POLICY,
  payload: PolicyHelper.createPolicy(policyData),
  meta: {
    notifications: {
      fulfilled: {
        variant: 'success',
        title: 'Success adding policy',
        description: 'The policy was added successfully.'
      },
      rejected: {
        variant: 'danger',
        title: 'Failed adding policy',
        description: 'The policy was not added successfully.'
      }
    }
  }
});

export const removePolicy = (policy) => ({
  type: ActionTypes.REMOVE_POLICY,
  payload: PolicyHelper.removePolicy(policy),
  meta: {
    notifications: {
      fulfilled: {
        variant: 'success',
        title: 'Success removing policy',
        description: 'The policy was removed successfully.'
      }
    }
  }
});

export const updatePolicy = (uuid, policyData) => ({
  type: ActionTypes.UPDATE_POLICY,
  payload: PolicyHelper.updatePolicy(uuid, policyData),
  meta: {
    notifications: {
      fulfilled: {
        variant: 'success',
        title: 'Success updating policy',
        description: 'The policy was updated successfully.'
      },
      rejected: {
        variant: 'danger',
        title: 'Failed updating policy',
        description: 'The policy was not updated successfully.'
      }
    }
  }
});
