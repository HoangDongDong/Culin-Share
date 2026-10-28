const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadApi() {
  const storage = new Map([['token', 'current-token'], ['user', '{}'], ['fridgeItems', '[]']]);
  const redirects = [];
  let requestHandler, rejectHandler, expired = 0;
  const context = {
    axios: { create: () => ({ interceptors: {
      request: { use: handler => { requestHandler = handler; } },
      response: { use: (_, handler) => { rejectHandler = handler; } },
    } }) },
    toast: { error() {} },
    window: {
      localStorage: { getItem: key => storage.get(key), removeItem: key => storage.delete(key) },
      location: { replace: url => redirects.push(url) },
    },
    Promise,
  };
  // Execute the actual interceptor source with browser/Axios boundaries stubbed.
  const source = fs.readFileSync(path.join(__dirname, '../frontend/src/services/api.js'), 'utf8')
    .replace(/^import .*$/gm, '')
    .replaceAll('import.meta.env.VITE_API_BASE_URL', 'undefined')
    .replaceAll('export const ', 'const ')
    .replace('export default api', '');
  vm.runInNewContext(`${source}\nsetAuthExpiredHandler(() => onExpired());`, { ...context, onExpired: () => { expired++; } });
  return { storage, redirects, request: config => requestHandler(config),
    reject: error => rejectHandler(error), expired: () => expired };
}

test('failed login preserves the current session and does not reload the page', async () => {
  const api = loadApi();
  const config = api.request({ url: '/api/login', headers: {} });
  assert.equal(config.headers.Authorization, undefined);
  await assert.rejects(api.reject({ config, response: { status: 401 } }));
  assert.equal(api.storage.get('token'), 'current-token');
  assert.deepEqual(api.redirects, []);
});

test('expired authenticated request clears private storage and notifies the store once', async () => {
  const api = loadApi();
  const config = api.request({ url: '/api/ai/distribute-dishes', headers: {} });
  const error = { config, response: { status: 401 } };
  await assert.rejects(api.reject(error));
  await assert.rejects(api.reject(error));
  assert.equal(api.storage.size, 0);
  assert.equal(api.expired(), 1);
  assert.deepEqual(api.redirects, ['/login']);
});

test('late 401 from an old session cannot log out the newly signed-in account', async () => {
  const api = loadApi();
  await assert.rejects(api.reject({ config: { url: '/api/notifications', headers: { Authorization: 'Bearer old-token' } }, response: { status: 401 } }));
  assert.equal(api.storage.get('token'), 'current-token');
  assert.equal(api.expired(), 0);
  assert.deepEqual(api.redirects, []);
});
