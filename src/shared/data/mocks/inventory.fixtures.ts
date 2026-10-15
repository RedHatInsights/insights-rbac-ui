export interface MockInventoryGroup {
  id: string;
  name: string;
  host_count: number;
  updated: string;
}

export const defaultInventoryGroups: MockInventoryGroup[] = [
  { id: 'inv-group-1', name: 'RHEL Servers', host_count: 42, updated: '2024-06-01T00:00:00Z' },
  { id: 'inv-group-2', name: 'Satellite Hosts', host_count: 15, updated: '2024-05-15T00:00:00Z' },
];

export interface MockCostResourceType {
  value: string;
  path: string;
  count: number;
}

export const defaultCostResourceTypes: MockCostResourceType[] = [
  { value: 'aws_accounts', path: '/api/cost-management/v1/resource-types/aws-accounts/', count: 5 },
  { value: 'gcp_accounts', path: '/api/cost-management/v1/resource-types/gcp-accounts/', count: 3 },
];

export interface MockCostResource {
  value: string;
}

export const defaultCostResources: Record<string, MockCostResource[]> = {
  'aws-accounts': [
    { value: 'AWS Account 001' },
    { value: 'AWS Account 002' },
    { value: 'AWS Account 003' },
    { value: 'AWS Account 004' },
    { value: 'AWS Account 005' },
  ],
  'gcp-accounts': [{ value: 'GCP Project Alpha' }, { value: 'GCP Project Beta' }, { value: 'GCP Project Gamma' }],
};
