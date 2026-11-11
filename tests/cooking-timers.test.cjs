const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const model = import(pathToFileURL(path.join(__dirname, '../frontend/src/services/cookingTimers.mjs')).href);

const timer = (overrides = {}) => ({ key: '1:11', recipeId: '1', recipeTitle: 'Trứng hấp',
    stepNumber: 1, durationSeconds: 90, runId: 'first-run', ...overrides });

test('countdown uses an absolute deadline even when background ticks are delayed', async () => {
    const { timerReducer, remainingMilliseconds } = await model;
    let state = timerReducer({ timers: [], now: 1000 }, { type: 'start', timer: timer(), now: 1000 });
    state = timerReducer(state, { type: 'tick', now: 76000 });
    assert.equal(remainingMilliseconds(state.timers[0], state.now), 15000);
    state = timerReducer(state, { type: 'tick', now: 101000 });
    assert.equal(state.timers[0].status, 'finished');
    assert.equal(remainingMilliseconds(state.timers[0], state.now), 0);
});

test('pause keeps millisecond precision and resume excludes the entire paused period', async () => {
    const { timerReducer, remainingMilliseconds } = await model;
    let state = timerReducer({ timers: [], now: 1000 }, { type: 'start', timer: timer(), now: 1000 });
    state = timerReducer(state, { type: 'pause', key: '1:11', now: 13750 });
    assert.equal(state.timers[0].remainingMs, 77250);
    state = timerReducer(state, { type: 'tick', now: 1000000 });
    assert.equal(state.timers[0].status, 'paused');
    assert.equal(state.timers[0].remainingMs, 77250);
    state = timerReducer(state, { type: 'resume', key: '1:11', now: 1000000 });
    assert.equal(remainingMilliseconds(state.timers[0], state.now), 77250);
    state = timerReducer(state, { type: 'tick', now: 1077250 });
    assert.equal(state.timers[0].status, 'finished');
});

test('steps and recipes keep separate timers, and a duplicate start cannot overwrite a running timer', async () => {
    const { timerReducer } = await model;
    let state = timerReducer({ timers: [], now: 0 }, { type: 'start', timer: timer(), now: 0 });
    state = timerReducer(state, { type: 'start', timer: timer({ key: '2:11', recipeId: '2' }), now: 1000 });
    const previous = state;
    state = timerReducer(state, { type: 'start', timer: timer({ durationSeconds: 500 }), now: 2000 });
    assert.equal(state, previous);
    state = timerReducer(state, { type: 'pause', key: '1:11', now: 3000 });
    assert.equal(state.timers[0].status, 'paused');
    assert.equal(state.timers[1].status, 'running');
});

test('reset cancels a deadline, removal cancels a timer, and restart gets a fresh notification cycle', async () => {
    const { timerReducer } = await model;
    let state = timerReducer({ timers: [], now: 0 }, { type: 'start', timer: timer(), now: 0 });
    state = timerReducer(state, { type: 'reset', key: '1:11', now: 5000 });
    state = timerReducer(state, { type: 'tick', now: 100000 });
    assert.equal(state.timers[0].status, 'idle');
    assert.equal(state.timers[0].remainingMs, 90000);
    state = timerReducer(state, { type: 'start', timer: timer({ runId: 'second-run' }), now: 100000 });
    state = timerReducer(state, { type: 'tick', now: 190000 });
    state = timerReducer(state, { type: 'notified', key: '1:11' });
    state = timerReducer(state, { type: 'tick', now: 200000 });
    assert.equal(state.timers[0].notified, true);
    state = timerReducer(state, { type: 'start', timer: timer({ runId: 'third-run' }), now: 200000 });
    assert.equal(state.timers[0].notified, false);
    assert.equal(state.timers[0].runId, 'third-run');
    state = timerReducer(state, { type: 'remove', key: '1:11' });
    assert.deepEqual(state.timers, []);
});

test('reload restores running and paused timers and catches up timers that expired while away', async () => {
    const { timerReducer, restoreTimers, remainingMilliseconds } = await model;
    let state = timerReducer({ timers: [], now: 1000 }, { type: 'start', timer: timer(), now: 1000 });
    let restored = restoreTimers(JSON.stringify(state.timers), 40000);
    assert.equal(remainingMilliseconds(restored[0], 40000), 51000);
    restored = restoreTimers(JSON.stringify(state.timers), 100000);
    assert.equal(restored[0].status, 'finished');
    assert.equal(restored[0].notified, false);
    state = timerReducer(state, { type: 'pause', key: '1:11', now: 20000 });
    restored = restoreTimers(JSON.stringify(state.timers), 1000000);
    assert.equal(restored[0].status, 'paused');
    assert.equal(restored[0].remainingMs, 71000);
    const generated = timerReducer({ timers: [], now: 0 }, { type: 'start', timer: timer({ recipeId: null, key: 'fridge-ai:test:1' }), now: 0 });
    assert.equal(restoreTimers(JSON.stringify(generated.timers), 1000)[0].recipeId, null);
});

test('invalid browser data and impossible durations cannot create a countdown', async () => {
    const { timerReducer, restoreTimers, MAX_TIMER_SECONDS } = await model;
    for (const raw of ['broken JSON', '{}', '[null]']) assert.deepEqual(restoreTimers(raw, 0), []);
    for (const durationSeconds of [-1, 0, 0.5, NaN, Infinity, MAX_TIMER_SECONDS + 1]) {
        const state = { timers: [], now: 0 };
        assert.equal(timerReducer(state, { type: 'start', timer: timer({ durationSeconds }), now: 0 }), state);
    }
    const state = timerReducer({ timers: [], now: 0 }, { type: 'start', timer: timer(), now: 0 });
    assert.equal(restoreTimers(JSON.stringify([...state.timers, ...state.timers]), 0).length, 1);
});

test('display rounds up partial seconds and supports durations longer than one hour', async () => {
    const { formatTimer } = await model;
    assert.equal(formatTimer(0), '00:00');
    assert.equal(formatTimer(0.1), '00:01');
    assert.equal(formatTimer(61), '01:01');
    assert.equal(formatTimer(3605), '60:05');
    assert.equal(formatTimer(-1), '00:00');
});

test('recipe steps preserve timers in JSON and multipart data, including legacy missing values', () => {
    const { parseRecipeSteps } = require('../backend/src/services/resourceSecurity');
    const steps = [{ instruction: 'Hấp chín', timer_seconds: '90' }, { instruction: 'Dọn ra đĩa' }];
    for (const value of [steps, JSON.stringify(steps)]) {
        assert.deepEqual(parseRecipeSteps(value).map(step => step.timer_seconds), [90, 0]);
    }
    assert.equal(parseRecipeSteps(undefined), undefined);
    assert.deepEqual(parseRecipeSteps([]), []);
    for (const value of [-1, 1.5, 'abc', {}, true, 2147483648]) {
        assert.throws(() => parseRecipeSteps([{ instruction: 'Nấu', timer_seconds: value }]), error => error.statusCode === 400);
    }
});

test('invalid timer data is rejected before creating or changing any recipe', async t => {
    const service = require('../backend/src/services/recipe.service');
    const repository = require('../backend/src/repositories/recipe.repository');
    const create = t.mock.method(repository, 'create', async () => { throw new Error('Unexpected write'); });
    const update = t.mock.method(repository, 'update', async () => { throw new Error('Unexpected write'); });
    const payload = { title: 'Món thử', steps: [{ instruction: 'Nấu', timer_seconds: -10 }] };
    await assert.rejects(service.createRecipe(1, payload), error => error.statusCode === 400);
    await assert.rejects(service.updateRecipe(1, 1, 'user', payload), error => error.statusCode === 400);
    assert.equal(create.mock.callCount(), 0);
    assert.equal(update.mock.callCount(), 0);
});

test('create and edit API entry points retain per-step timers with and without uploaded images', async () => {
    const fs = require('node:fs');
    const vm = require('node:vm');
    const calls = [];
    const source = fs.readFileSync(path.join(__dirname, '../frontend/src/services/recipeApi.js'), 'utf8')
        .replace(/^import .*$/gm, '').replaceAll('export const ', 'const ');
    const api = vm.runInNewContext(`${source}\n({ createRecipeApi, updateRecipeApi });`, {
        FormData,
        api: {
            post: async (url, data) => { calls.push(data); return { data: { success: true } }; },
            put: async (url, data) => { calls.push(data); return { data: { success: true } }; }
        }
    });
    for (const image_file of [null, new Blob(['fixture'], { type: 'image/png' })]) {
        const data = { title: 'Món thử', steps: [{ instruction: 'Hấp chín', timer_seconds: 95, image_file }] };
        await api.createRecipeApi(data);
        await api.updateRecipeApi(1, data);
    }
    assert.equal(calls.length, 4);
    for (const data of calls) {
        const steps = data instanceof FormData ? JSON.parse(data.get('steps')) : data.steps;
        assert.equal(steps[0].timer_seconds, 95);
        assert.equal(steps[0].instruction, 'Hấp chín');
    }
});
