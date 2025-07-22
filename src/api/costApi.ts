import { axiosInstance } from './axiosConfig';
import { COST_API_BASE } from '../utilities/constants';

interface CostApiResponse {
  getResourceTypes: () => Promise<any>;
  getResource: (path: string) => Promise<any>;
}

export function getCostApi(): CostApiResponse {
  return {
    getResourceTypes: () => axiosInstance.get(`${COST_API_BASE}/resource-types/`),
    getResource: (path: string) => axiosInstance.get(`${path}?limit=20000`),
  };
}
