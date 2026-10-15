import { HttpResponse, delay, http } from 'msw';
import type { MockCostResource, MockCostResourceType } from './inventory.fixtures';

const MOCK_DELAY = 200;

/**
 * MSW handlers for cost-management resource types and resources.
 * Shared between V1 and V2 — the cost-management API is not version-specific.
 */
export function createCostHandlers(
  costResourceTypes: MockCostResourceType[] = [],
  costResources: Record<string, MockCostResource[]> = {},
  options: { networkDelay?: number } = {},
) {
  const networkDelay = options.networkDelay ?? MOCK_DELAY;

  return [
    http.get('*/api/cost-management/v1/resource-types/', async () => {
      await delay(networkDelay);
      return HttpResponse.json({
        data: costResourceTypes,
        meta: { count: costResourceTypes.length, limit: 1000, offset: 0 },
        links: {},
      });
    }),

    http.get('*/api/cost-management/v1/resource-types/:resourceTypeSlug/', async ({ params }) => {
      await delay(networkDelay);
      const slug = params.resourceTypeSlug as string;
      const resources = costResources[slug] ?? [];
      return HttpResponse.json({
        data: resources,
        meta: { count: resources.length, limit: 20000, offset: 0 },
        links: {},
      });
    }),
  ];
}
