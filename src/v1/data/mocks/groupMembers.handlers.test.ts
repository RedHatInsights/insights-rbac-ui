import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SAT_SERVICE_ACCOUNT } from '../../../shared/data/mocks/seed';

const groupId = 'sat-group';
const url = `http://localhost/api/rbac/v1/groups/${groupId}/principals/`;
let stopServer: () => void;

beforeAll(async () => {
  const { TextEncoder, TextDecoder } = await import('node:util');
  Object.assign(globalThis, { TextEncoder, TextDecoder });
  const [{ setupServer }, { createV1MockDb }, { createV1Handlers }] = await Promise.all([import('msw/node'), import('./db'), import('./handlers')]);
  const db = createV1MockDb({ serviceAccounts: [SAT_SERVICE_ACCOUNT] });
  await db.ready;
  const server = setupServer(...createV1Handlers(db));
  server.listen({ onUnhandledRequest: 'error' });
  stopServer = () => server.close();
});
afterAll(() => stopServer?.());

describe('V1 group membership handlers', () => {
  it('retains SAT type on save and removes the saved account by client ID', async () => {
    const addResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ principals: [{ clientId: SAT_SERVICE_ACCOUNT.clientId, type: 'service-account' }] }),
    });
    expect(addResponse.status).toBe(200);

    const listUrl = `${url}?principal_type=service-account`;
    const saved = await (await fetch(listUrl)).json();
    expect(saved.data).toEqual([expect.objectContaining({ clientId: SAT_SERVICE_ACCOUNT.clientId, service_account_type: 'service_access_token' })]);

    const deleteResponse = await fetch(`${url}?serviceAccounts=${encodeURIComponent(SAT_SERVICE_ACCOUNT.clientId)}`, { method: 'DELETE' });
    expect(deleteResponse.status).toBe(204);
    const removed = await (await fetch(listUrl)).json();
    expect(removed.data).toEqual([]);
  });
});
