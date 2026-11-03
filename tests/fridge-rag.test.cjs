const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const rag = require('../backend/src/services/fridgeRag.service');
const embeddings = require('../backend/src/services/embedding.service');
const ai = require('../backend/src/services/ai.service');
const repo = require('../backend/src/repositories/recipe.repository');
const options = { ingredients: [{ name: 'Hành tăm', quantity: '50g' }, { name: 'Gà', quantity: '1kg' }], peopleCount: 2, dishCount: 2, cookingSpeed: '60 phút', complexity: 'dễ' };
const recipe = (extra = {}) => ({ id: 42, title: 'Mì Quảng gà nén', description: 'Bài viết thật',
    servings: 4, prep_time_minutes: 30, cook_time_minutes: 45, retrievalScore: 0.8,
    ingredients: [{ name: 'Củ nén', quantity: 50, unit: 'g' }, { name: 'Thịt gà ta', quantity: 1, unit: 'kg' }, { name: 'Mì Quảng', quantity: 800, unit: 'g' }], ...extra });
const matches = [{ recipeId: 42, ingredientIndex: 0, fridgeIndex: 0, confidence: 0.97 }, { recipeId: 42, ingredientIndex: 1, fridgeIndex: 1, confidence: 0.97 }];
const newDish = { sourceRecipeId: null, name: 'Món mới', ingredients: [{ name: 'Gà', quantity: 100, unit: 'g' }], steps: ['Nấu chín kỹ.'], prepTime: 5, cookTime: 10 };

test('RAG retrieves context before generation, using stored facts and estimated semantic matches', async t => {
    const events = [];
    t.mock.method(rag, 'retrieve', async () => { events.push('retrieve'); return [recipe()]; });
    t.mock.method(ai, 'getFridgeSuggestions', async input => {
        events.push('generate'); assert.equal(input.retrievedRecipes[0].id, 42);
        return { ingredientMatches: matches, recipes: [{ sourceRecipeId: 42, name: 'Tên bịa', ingredients: [] }, newDish] };
    });
    const result = await rag.suggest(options);
    assert.deepEqual(events, ['retrieve', 'generate']);
    assert.equal(result.recipes[0].name, 'Mì Quảng gà nén');
    assert.equal(result.recipes[0].ingredientCoverage, 2 / 3);
    assert.equal(result.recipes[0].ingredients[0].quantity, 25);
    assert.equal(result.recipes[0].matchType, 'rag');
    assert.deepEqual(result.shoppingList, ['400 g Mì Quảng']);
    assert.equal(result.retrieval.method, 'rag');
});

test('semantic matches can promote a retrieved dish even if generation omits its ID', () => {
    const result = rag.assemble({ ingredientMatches: matches, recipes: [newDish] }, [recipe()], options);
    assert.equal(result.recipes[0].recipeId, 42);
    assert.equal(result.recipes[0].matchedIngredientCount, 2);
});

test('invented IDs, out-of-bounds and uncertain matches cannot create citations or inflate coverage', () => {
    const result = rag.assemble({ ingredientMatches: [
        ...matches.map(item => ({ ...item, confidence: 0.5 })),
        { ...matches[0], ingredientIndex: 999 }, { ...matches[0], fridgeIndex: -1 },
        { ...matches[0], recipeId: 999 },
    ], recipes: [{ sourceRecipeId: 999 }, newDish] }, [recipe()], options);
    assert.equal(result.recipes.length, 1);
    assert.equal(result.recipes[0].source, 'ai');
});

test('ambiguous equivalences are not merged, and exact user ingredient names cannot be overridden', () => {
    const conflicting = [matches[0], { ...matches[0], fridgeIndex: 1 }];
    const result = rag.assemble({ ingredientMatches: conflicting, recipes: [{ sourceRecipeId: 42 }] }, [recipe()], options);
    assert.equal(result.recipes[0].ingredientCoverage, 0);
    const exact = { ...options, ingredients: [{ name: 'Củ nén', quantity: '50g' }, { name: 'Gà', quantity: '1kg' }] };
    const stable = rag.assemble({ ingredientMatches: [{ ...matches[0], fridgeIndex: 1 }], recipes: [{ sourceRecipeId: 42 }] }, [recipe()], exact);
    assert.equal(stable.recipes[0].matchedIngredientCount, 1);
});

test('retrieval ranks by semantic vectors, limits the LLM context and does not persist user queries', async t => {
    const all = Array.from({ length: 20 }, (_, index) => recipe({ id: index + 1 }));
    t.mock.method(repo, 'findPublishedForMatching', async () => all);
    let calls = 0;
    t.mock.method(embeddings, 'embed', async (texts, task, config) => {
        calls++;
        if (task === 'RETRIEVAL_DOCUMENT') return texts.map((_, index) => index === 19 ? [1, 0] : [0, 1]);
        assert.equal(task, 'RETRIEVAL_QUERY'); assert.equal(config.cache, false); return [[1, 0]];
    });
    const context = await rag.retrieve(options);
    assert.equal(context.length, 12); assert.equal(context[0].id, 20); assert.equal(calls, 2);
});

test('empty published catalog still supports explicitly labelled new AI recipes', async t => {
    t.mock.method(repo, 'findPublishedForMatching', async () => []);
    t.mock.method(embeddings, 'embed', async () => { throw new Error('Should not embed an empty catalog'); });
    t.mock.method(ai, 'getFridgeSuggestions', async input => { assert.deepEqual(input.retrievedRecipes, []); return { recipes: [newDish] }; });
    assert.equal((await rag.suggest(options)).recipes[0].source, 'ai');
});

test('embedding cache survives restart, refreshes changed documents and never caches fridge queries', async t => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'culinshare-rag-'));
    const cachePath = path.join(dir, 'vectors.json');
    const previousKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-key';
    t.after(async () => { if (previousKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = previousKey; await fs.unlink(cachePath).catch(() => {}); await fs.rmdir(dir); });
    let calls = 0;
    t.mock.method(global, 'fetch', async (_, request) => {
        calls++;
        const body = JSON.parse(request.body);
        assert.equal(request.headers['x-goog-api-key'], 'test-key');
        assert.ok(body.requests.every(item => item.outputDimensionality === 768));
        return { ok: true, json: async () => ({ embeddings: body.requests.map(() => ({ values: [1, ...Array(767).fill(0)] })) }) };
    });
    const service = new embeddings.EmbeddingService({ cachePath });
    await service.embed(['catalog-v1'], 'RETRIEVAL_DOCUMENT');
    await new embeddings.EmbeddingService({ cachePath }).embed(['catalog-v1'], 'RETRIEVAL_DOCUMENT');
    assert.equal(calls, 1);
    await service.embed(['catalog-v2'], 'RETRIEVAL_DOCUMENT'); assert.equal(calls, 2);
    await service.embed(['private-fridge'], 'RETRIEVAL_QUERY', { cache: false });
    await service.embed(['private-fridge'], 'RETRIEVAL_QUERY', { cache: false });
    assert.equal(calls, 4);
    assert.equal(JSON.parse(await fs.readFile(cachePath, 'utf8')).length, 2);
});

test('embedding failures return an actionable error instead of falling back to fake RAG', async t => {
    const previousKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-key';
    t.after(() => { if (previousKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = previousKey; });
    t.mock.method(global, 'fetch', async () => ({ ok: false, status: 429 }));
    const service = new embeddings.EmbeddingService({ cachePath: path.join(os.tmpdir(), 'nonexistent-rag-test-cache.json') });
    await assert.rejects(service.embed(['query'], 'RETRIEVAL_QUERY', { cache: false }), /HTTP 429/);
});

test('generation request contains only retrieved context and uses the configured model', async t => {
    const previousKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-key';
    t.after(() => { if (previousKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = previousKey; });
    t.mock.method(console, 'log', () => {});
    t.mock.method(global, 'fetch', async (_, request) => {
        const prompt = JSON.parse(request.body).contents[0].parts[0].text;
        assert.ok(prompt.includes('NGỮ CẢNH RAG'));
        assert.ok(prompt.includes('Mì Quảng gà nén'));
        assert.ok(prompt.includes('sourceRecipeId'));
        assert.ok(prompt.includes('ingredientMatches'));
        return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ recipes: [{ sourceRecipeId: 42 }], ingredientMatches: matches }) }] } }] }) };
    });
    assert.equal((await ai.getFridgeSuggestions({ ...options, retrievedRecipes: [recipe()] })).recipes[0].sourceRecipeId, 42);
});

test('API delegates to RAG and rejects malformed input before an external call', async t => {
    const pool = require('../backend/src/config/database');
    t.mock.method(pool, 'query', async sql => { assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS ai_logs')); return [[]]; });
    const controller = require('../backend/src/controllers/ai.controller');
    const admin = require('../backend/src/repositories/admin.repository');
    t.mock.method(admin, 'logAiUsage', async () => {});
    let calls = 0, status, body;
    t.mock.method(rag, 'suggest', async input => { calls++; assert.equal(input.dishCount, 2); return { recipes: [], shoppingList: [], retrieval: { method: 'rag' } }; });
    const response = { status(code) { status = code; return this; }, json(data) { body = data; return this; } };
    await controller.suggestRecipesFromFridge({ body: options, user: { id: 1 } }, response, error => { throw error; });
    assert.equal(status, 200); assert.equal(body.data.retrieval.method, 'rag');
    await controller.suggestRecipesFromFridge({ body: { ...options, ingredients: [null] } }, response, error => { throw error; });
    assert.equal(status, 400); assert.equal(calls, 1);
});

test('only published database documents and ingredients enter the retrieval catalog', async t => {
    const pool = require('../backend/src/config/database');
    const queries = [];
    t.mock.method(pool, 'query', async sql => {
        queries.push(sql);
        return queries.length === 1 ? [[recipe()]] : [[{ recipe_id: 42, name: 'Củ nén', quantity: 50, unit: 'g' }]];
    });
    const catalog = await repo.findPublishedForMatching();
    assert.equal(catalog[0].ingredients.length, 1);
    assert.ok(queries.every(sql => sql.includes("r.status = 'published'")));
});
