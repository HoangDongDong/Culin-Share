const { test } = require('node:test');
const assert = require('node:assert/strict');
const ai = require('../backend/src/services/ai.service');

test('dish distribution uses the configured HTTP model and rejects invalid AI output', async t => {
  t.mock.method(console, 'log', () => {});
  t.mock.method(console, 'warn', () => {});
  t.mock.method(console, 'error', () => {});
  const previousKey = process.env.GEMINI_API_KEY;
  const previousModel = process.env.GEMINI_MODEL;
  process.env.GEMINI_API_KEY = 'audit-fake-key';
  process.env.GEMINI_MODEL = 'audit-fake-model';
  t.after(() => {
    for (const [key, value] of [['GEMINI_API_KEY', previousKey], ['GEMINI_MODEL', previousModel]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });
  const realTimeout = global.setTimeout;
  t.mock.method(global, 'setTimeout', callback => realTimeout(callback, 0));
  let output = { easy: 1, medium: 1, hard: 0 };
  let requests = 0;
  t.mock.method(global, 'fetch', async (url, options) => {
    requests++;
    assert.ok(url.includes('/audit-fake-model:generateContent'));
    assert.equal(JSON.parse(options.body).generationConfig.responseMimeType, 'application/json');
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(output) }] } }] }) };
  });
  assert.deepEqual(await ai.suggestDishDistribution(2, 30), output);
  assert.equal(requests, 1);
  output = { easy: -1, medium: 9, hard: 0 };
  await assert.rejects(ai.suggestDishDistribution(2, 30));
  assert.equal(requests, 4);
  delete process.env.GEMINI_API_KEY;
  await assert.rejects(ai.suggestDishDistribution(2, 30), /GEMINI_API_KEY/);
  assert.equal(requests, 4);
});
