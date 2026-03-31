import { HttpResponse, delay, http } from 'msw';
import {
  type MockCostResource,
  type MockCostResourceType,
  type MockInventoryGroup,
  defaultCostResourceTypes,
  defaultCostResources,
  defaultInventoryGroups,
} from './inventory.fixtures';
import { createCostHandlers } from './cost.handlers';

const MOCK_DELAY = 200;

export interface InventoryHandlerOptions {
  networkDelay?: number;
  onGroupsList?: (request: Request) => void;
}

export function createInventoryHandlers(
  inventoryGroups: MockInventoryGroup[] = defaultInventoryGroups,
  costResourceTypes: MockCostResourceType[] = defaultCostResourceTypes,
  options: InventoryHandlerOptions = {},
  costResources: Record<string, MockCostResource[]> = defaultCostResources,
) {
  const networkDelay = options.networkDelay ?? MOCK_DELAY;

  return [
    http.get(/\/api\/inventory\/v1\/groups/, async ({ request }) => {
      await delay(networkDelay);
      options.onGroupsList?.(request);
      const url = new URL(request.url);
      const perPage = parseInt(url.searchParams.get('per_page') || '50', 10);
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const nameFilter = url.searchParams.get('name');

      let groups = inventoryGroups;
      if (nameFilter) {
        groups = groups.filter((g) => g.name.toLowerCase().includes(nameFilter.toLowerCase()));
      }

      const offset = (page - 1) * perPage;
      const paginated = groups.slice(offset, offset + perPage);

      return HttpResponse.json({
        results: paginated,
        total: groups.length,
        count: paginated.length,
        per_page: perPage,
        page,
      });
    }),

    http.get('*/api/inventory/v1/resource-types/inventory-groups', async () => {
      await delay(networkDelay);
      return HttpResponse.json({
        data: inventoryGroups.map((g) => ({ id: g.id, name: g.name })),
        meta: { count: inventoryGroups.length },
        links: { first: null, previous: null, next: null, last: null },
      });
    }),

    http.get('*/api/inventory/v1/groups/:groupIds', async ({ params }) => {
      await delay(networkDelay);
      const ids = (params.groupIds as string).split(',');
      const matched = inventoryGroups.filter((g) => ids.includes(g.id));
      return HttpResponse.json({ results: matched, total: matched.length });
    }),

    ...createCostHandlers(costResourceTypes, costResources, { networkDelay }),
  ];
}

/** Convenience wrapper with default data */
export function inventoryHandlers(
  inventoryGroups?: MockInventoryGroup[],
  costResourceTypes?: MockCostResourceType[],
  options?: InventoryHandlerOptions,
) {
  return createInventoryHandlers(inventoryGroups, costResourceTypes, options);
}

/** All inventory/cost endpoints return the given error status */
export function inventoryErrorHandlers(status: number = 500) {
  const body = { error: 'Error' };
  return [
    http.get(/\/api\/inventory\/v1\/groups$/, () => HttpResponse.json(body, { status })),
    http.get('*/api/inventory/v1/resource-types/inventory-groups', () => HttpResponse.json(body, { status })),
    http.get('*/api/inventory/v1/groups/:groupIds', () => HttpResponse.json(body, { status })),
    http.get('*/api/cost-management/v1/resource-types/', () => HttpResponse.json(body, { status })),
    http.get('*/api/cost-management/v1/resource-types/:resourceTypeSlug/', () => HttpResponse.json(body, { status })),
  ];
}

/** All inventory/cost endpoints delay forever (loading state) */
export function inventoryLoadingHandlers() {
  const handler = async () => {
    await delay('infinite');
    return new HttpResponse(null);
  };
  return [
    http.get(/\/api\/inventory\/v1\/groups$/, handler),
    http.get('*/api/inventory/v1/resource-types/inventory-groups', handler),
    http.get('*/api/inventory/v1/groups/:groupIds', handler),
    http.get('*/api/cost-management/v1/resource-types/', handler),
    http.get('*/api/cost-management/v1/resource-types/:resourceTypeSlug/', handler),
  ];
}
