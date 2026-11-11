const { test } = require('node:test');
const assert = require('node:assert/strict');
const ai = require('../backend/src/services/ai.service');
const timing = require('../backend/src/services/stepTiming.service');
const repository = require('../backend/src/repositories/recipe.repository');
const pool = require('../backend/src/config/database');
const recipe = { id: 55, title: 'Trứng hấp', servings: 2, author_id: 7, status: 'published' };
const steps = [
    { id: 101, step_number: 1, instruction: 'Đập trứng và đánh đều.', timer_seconds: 90 },
    { id: 102, step_number: 2, instruction: 'Hấp trứng đến khi đông.', timer_seconds: 0 }
];

test('AI receives only missing steps and existing durations are retained', async t => {
    t.mock.method(ai, 'estimateStepTimers', async input => {
        assert.deepEqual(input.steps, [{ step_number: 2, instruction: steps[1].instruction }]);
        assert.equal(input.servings, 2);
        return [{ step_number: 2, timer_seconds: 600 }];
    });
    assert.deepEqual(await timing.complete({ ...recipe, steps: steps.map(step => step.instruction), stepTimers: [90, 0] }), [90, 600]);
});

test('fully timed recipes never call AI again', async t => {
    const call = t.mock.method(ai, 'estimateStepTimers', async () => { throw new Error('Unexpected AI call'); });
    t.mock.method(repository, 'findById', async () => recipe);
    t.mock.method(repository, 'getSteps', async () => steps.map(step => ({ ...step, timer_seconds: 90 })));
    assert.equal((await timing.ensureStored(55)).length, 2);
    assert.equal(call.mock.callCount(), 0);
});

test('missing durations are generated once for concurrent readers and saved for later views', async t => {
    let saved = false;
    t.mock.method(repository, 'findById', async () => recipe);
    t.mock.method(repository, 'getSteps', async () => steps.map(step => ({ ...step, timer_seconds: saved && step.id === 102 ? 600 : step.timer_seconds })));
    t.mock.method(repository, 'getIngredients', async () => [{ name: 'Trứng', quantity: 2, unit: 'quả' }]);
    const estimate = t.mock.method(ai, 'estimateStepTimers', async () => [{ step_number: 2, timer_seconds: 600 }]);
    t.mock.method(repository, 'fillMissingStepTimers', async (id, result) => {
        assert.equal(id, 55);
        assert.deepEqual(result.map(step => step.timer_seconds), [90, 600]);
        assert.equal(result[1].instruction, steps[1].instruction);
        saved = true;
    });
    const [first, second] = await Promise.all([timing.ensureStored(55), timing.ensureStored(55)]);
    assert.deepEqual(first, second);
    assert.equal(first[1].timer_seconds, 600);
    await timing.ensureStored(55);
    assert.equal(estimate.mock.callCount(), 1);
    assert.equal(timing.pending.size, 0);
});

test('draft steps are protected and failed AI requests can be retried', async t => {
    t.mock.method(repository, 'findById', async () => ({ ...recipe, status: 'draft' }));
    await assert.rejects(timing.ensureStored(55), error => error.statusCode === 404);
    await assert.rejects(timing.ensureStored(55, { id: 8, role: 'user' }), error => error.statusCode === 404);
    t.mock.method(repository, 'getSteps', async () => steps);
    t.mock.method(repository, 'getIngredients', async () => []);
    const save = t.mock.method(repository, 'fillMissingStepTimers', async () => {});
    const estimate = t.mock.method(ai, 'estimateStepTimers', async () => { throw Object.assign(new Error('quota'), { statusCode: 503 }); });
    for (let attempt = 0; attempt < 2; attempt++) {
        await assert.rejects(timing.ensureStored(55, { id: 7 }), /quota/);
        assert.equal(timing.pending.size, 0);
    }
    assert.equal(estimate.mock.callCount(), 2);
    assert.equal(save.mock.callCount(), 0);
});

test('timer writes use a transaction and protect concurrently edited instructions and durations', async t => {
    const events = [];
    t.mock.method(pool, 'getConnection', async () => ({
        async beginTransaction() { events.push('begin'); },
        async query(sql, params) {
            assert.match(sql, /recipe_id = \? AND id = \? AND instruction = \?/);
            assert.match(sql, /timer_seconds IS NULL OR timer_seconds <= 0/);
            assert.equal(params[1], 55);
            events.push(params[2]);
        },
        async commit() { events.push('commit'); },
        async rollback() { events.push('rollback'); },
        release() { events.push('release'); }
    }));
    await repository.fillMissingStepTimers(55, steps);
    assert.deepEqual(events, ['begin', 101, 102, 'commit', 'release']);
});

test('a failed timer write rolls back all steps and releases the connection', async t => {
    const events = [];
    t.mock.method(pool, 'getConnection', async () => ({
        async beginTransaction() {},
        async query() { throw new Error('write failed'); },
        async commit() { events.push('commit'); },
        async rollback() { events.push('rollback'); },
        release() { events.push('release'); }
    }));
    await assert.rejects(repository.fillMissingStepTimers(55, steps), /write failed/);
    assert.deepEqual(events, ['rollback', 'release']);
});

test('Gemini is asked to infer missing times and retries an incomplete response', async t => {
    const previousKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-key';
    t.after(() => { if (previousKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = previousKey; });
    let calls = 0;
    t.mock.method(global, 'fetch', async (url, request) => {
        calls++;
        const prompt = JSON.parse(request.body).contents[0].parts[0].text;
        assert.match(prompt, /BẮT BUỘC suy luận/);
        assert.match(prompt, /Đập trứng/);
        return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ steps: calls === 1 ? [] : [{ step_number: 1, timer_seconds: 75 }] }) }] } }] }) };
    });
    const result = await ai.estimateStepTimers({ ...recipe, steps: [{ step_number: 1, instruction: steps[0].instruction }] });
    assert.deepEqual(result, [{ step_number: 1, timer_seconds: 75 }]);
    assert.equal(calls, 2);
});

test('invalid AI durations never become fabricated defaults', async t => {
    const previousKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-key';
    t.after(() => { if (previousKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = previousKey; });
    t.mock.method(global, 'fetch', async () => ({ ok: true, json: async () => ({
        candidates: [{ content: { parts: [{ text: '{"steps":[{"step_number":1,"timer_seconds":0}]}' }] } }]
    }) }));
    await assert.rejects(ai.estimateStepTimers({ ...recipe, steps: [{ step_number: 1, instruction: steps[0].instruction }] }), error => error.statusCode === 502);
});

test('generated fridge recipes keep AI step durations and flag older missing values for completion', () => {
    const rag = require('../backend/src/services/fridgeRag.service');
    const generated = { sourceRecipeId: null, name: 'Trứng hấp', steps: ['Hấp trứng.'], stepTimers: [600],
        ingredients: [{ name: 'Trứng', quantity: 2, unit: 'quả' }] };
    const options = { ingredients: [{ name: 'Trứng', quantity: '2 quả' }], peopleCount: 2, dishCount: 1 };
    const result = rag.assemble({ recipes: [generated] }, [], options);
    assert.deepEqual(result.recipes[0].steps, ['Hấp trứng.']);
    assert.deepEqual(result.recipes[0].stepTimers, [600]);
    const legacy = rag.assemble({ recipes: [{ ...generated, stepTimers: undefined }] }, [], options);
    assert.deepEqual(legacy.recipes[0].stepTimers, [0]);
});
