import axios from 'axios';

/**
 * Clean axios instance - NO interceptors.
 * The rbac-client library handles response unwrapping.
 */
export const apiClient = axios.create();

// Export base paths
export { RBAC_API_BASE, RBAC_API_BASE_2, COST_API_BASE, INVENTORY_API_BASE } from '../../utilities/constants';
