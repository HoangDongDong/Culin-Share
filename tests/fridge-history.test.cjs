const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../backend/src/config/database');
const history = require('../backend/src/repositories/fridgeHistory.repository');
const rag = require('../backend/src/services/fridgeRag.service');
let controller, admin;

before(() => {
    // Prevent the existing admin repository's startup DDL from reaching a database.
    const query = pool.query;
    pool.query = async () => [[]];
    try {
        controller = require('../backend/src/controllers/ai.controller');
        admin = require('../backend/src/repositories/admin.repository');
    } finally { pool.query = query; }
});

const config = {
    ingredients: [{ name: 'Trứng gà', quantity: '3 quả' }], peopleCount: 2,
    dishCount: 1, dishDistribution: { easy: 1, medium: 0, hard: 0 }, cookingSpeed: '30 phút'
};
const result = { recipes: [{ name: 'Trứng hấp', source: 'ai', steps: ['Hấp chín.'] }], shoppingList: ['20 g Hành'] };

function response() {
    return { code: 200, body: null,
        status(code) { this.code = code; return this; },
        json(body) { this.body = body; return this; }
    };
}

test('successful suggestions save complete snapshots under the authenticated account before replying', async t => {
    t.mock.method(rag, 'suggest', async () => result);
    t.mock.method(admin, 'logAiUsage', async () => {});
    const snapshots = [];
    t.mock.method(history, 'create', async (userId, request, output) => {
        snapshots.push(structuredClone({ userId, request, output }));
        return snapshots.length;
    });
    for (let i = 1; i <= 2; i++) {
        const res = response();
        await controller.suggestRecipesFromFridge({ user: { id: 12 }, body: config }, res, error => { throw error; });
        assert.equal(res.body.historyId, i);
        assert.deepEqual(res.body.data, result);
    }
    assert.equal(snapshots.length, 2);
    assert.equal(snapshots[0].userId, 12);
    assert.deepEqual(snapshots[0].request.ingredients, config.ingredients);
    assert.deepEqual(snapshots[0].request.dishDistribution, config.dishDistribution);
    assert.equal(snapshots[0].request.peopleCount, 2);
    assert.equal(snapshots[0].request.cookingSpeed, '30 phút');
    assert.deepEqual(snapshots[0].output, result);
});

test('failed generation or invalid distribution never creates a history record', async t => {
    const save = t.mock.method(history, 'create', async () => 1);
    const suggest = t.mock.method(rag, 'suggest', async () => { throw new Error('provider failed'); });
    const invalid = response();
    await controller.suggestRecipesFromFridge({ user: { id: 12 }, body: { ...config, dishDistribution: { easy: 7, medium: 0, hard: 0 } } }, invalid, error => { throw error; });
    assert.equal(invalid.code, 400);
    assert.equal(suggest.mock.callCount(), 0);
    let failure;
    await controller.suggestRecipesFromFridge({ user: { id: 12 }, body: config }, response(), error => { failure = error; });
    assert.match(failure.message, /provider failed/);
    assert.equal(save.mock.callCount(), 0);
});

test('a failed history write cannot report a successful saved suggestion', async t => {
    t.mock.method(rag, 'suggest', async () => result);
    t.mock.method(history, 'create', async () => { throw new Error('database unavailable'); });
    const res = response();
    let failure;
    await controller.suggestRecipesFromFridge({ user: { id: 12 }, body: config }, res, error => { failure = error; });
    assert.match(failure.message, /database unavailable/);
    assert.equal(res.body, null);
});

test('older clients can generate without a distribution and keep the existing response data', async t => {
    t.mock.method(rag, 'suggest', async () => result);
    t.mock.method(admin, 'logAiUsage', async () => {});
    t.mock.method(history, 'create', async (userId, saved) => {
        assert.equal(saved.dishDistribution, null);
        assert.deepEqual(saved.ingredients, [{ name: 'Trứng', quantity: '' }]);
        return 7;
    });
    const res = response();
    await controller.suggestRecipesFromFridge({ user: { id: 12 }, body: { ingredients: ['Trứng'] } }, res, error => { throw error; });
    assert.deepEqual(res.body.data, result);
    assert.equal(res.body.historyId, 7);
});

test('repository scopes reads and deletion by owner and paginates with a stable ID cursor', async t => {
    const rows = Array.from({ length: 11 }, (_, index) => ({
        id: 29 - index, created_at: '2026-11-11T04:00:00.000Z',
        request_config: JSON.stringify(config), recipe_names: JSON.stringify(['Trứng hấp'])
    }));
    t.mock.method(pool, 'query', async (sql, params) => {
        assert.match(sql, /WHERE user_id = \?/);
        if (sql.includes('LIMIT 11')) {
            assert.match(sql, /AND id < \? ORDER BY id DESC/);
            assert.deepEqual(params, [12, 30]);
            return [rows];
        }
        assert.match(sql, /AND id = \?/);
        assert.deepEqual(params, [12, 29]);
        if (sql.startsWith('DELETE')) return [{ affectedRows: 0 }];
        return [[{ id: 29, request_config: config, result: JSON.stringify(result) }]];
    });
    const page = await history.list(12, 30);
    assert.equal(page.entries.length, 10);
    assert.equal(page.nextCursor, 20);
    assert.deepEqual(page.entries[0].request_config, config);
    assert.deepEqual(page.entries[0].recipe_names, ['Trứng hấp']);
    const detail = await history.findById(12, 29);
    assert.deepEqual(detail.result, result);
    assert.equal(await history.delete(12, 29), false);
});

test('history HTTP routes enforce authentication, validate IDs and hide other accounts records', async t => {
    const express = require('../backend/node_modules/express');
    const jwt = require('../backend/src/services/jwt.service');
    const previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'fridge-history-test-secret';
    t.after(() => {
        if (previousSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = previousSecret;
    });
    t.mock.method(history, 'findById', async (userId, id) => userId === 12 && id === 1 ? { id, request_config: config, result } : null);
    t.mock.method(history, 'delete', async userId => userId === 12);
    t.mock.method(history, 'list', async userId => ({ entries: userId === 12 ? [{ id: 1 }] : [], nextCursor: null }));
    const app = express();
    app.use('/api', require('../backend/src/routes/ai.routes'));
    app.use((error, req, res, next) => res.status(error.statusCode || 500).json({ success: false }));
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    t.after(() => new Promise(resolve => server.close(resolve)));
    const base = `http://127.0.0.1:${server.address().port}/api/ai/fridge-history`;
    const headers = userId => ({ Authorization: `Bearer ${jwt.generateToken({ id: userId, role: 'user' })}` });
    for (const [path, method] of [['', 'GET'], ['/1', 'GET'], ['/1', 'DELETE']]) {
        assert.equal((await fetch(base + path, { method })).status, 401);
    }
    assert.equal((await fetch(base + '/1', { headers: headers(99) })).status, 404);
    assert.equal((await fetch(base + '/1', { headers: headers(99), method: 'DELETE' })).status, 404);
    const detail = await fetch(base + '/1', { headers: headers(12) });
    assert.deepEqual((await detail.json()).data.result, result);
    const list = await fetch(base, { headers: headers(99) });
    assert.deepEqual((await list.json()).data.entries, []);
    for (const path of ['/0', '/-1', '/1.5', '?before=abc']) {
        assert.equal((await fetch(base + path, { headers: headers(12) })).status, 400);
    }
    assert.equal((await fetch(base + '/1', { headers: headers(12), method: 'DELETE' })).status, 200);
});
