const { test } = require('node:test');
const assert = require('node:assert/strict');
const { enrichSuggestions, matchScore, shoppingPlan } = require('../backend/src/services/fridgeMatching.service');

const beef = quantity => ({ name: 'Thịt bò', quantity, unit: 'g' });
const stored = (overrides = {}) => ({
    id: 42, title: 'Phở bò tái chín', description: 'Công thức thật',
    servings: 4, prep_time_minutes: 15, cook_time_minutes: 30, difficulty: 'dễ',
    author_name: 'Đầu bếp', cover_image_url: '/pho.jpg',
    ingredients: [beef('800'), { name: 'Bánh phở', quantity: '1', unit: 'kg' }], ...overrides,
});
const suggested = (overrides = {}) => ({
    name: 'Phở tái chín', difficulty: 'dễ',
    ingredients: [beef(200), { name: 'Bánh phở', quantity: 250, unit: 'g' }], ...overrides,
});
const context = { ingredients: [{ name: 'Bò', quantity: '500g' }, { name: 'phở', quantity: '1KG' }], peopleCount: 2, cookingSpeed: '45 phút' };

test('matching prioritizes real recipes, scales portions, and opens the correct database ID', () => {
    const result = enrichSuggestions({ recipes: [suggested({ name: 'Trứng hấp', ingredients: [{ name: 'Trứng gà', quantity: 2, unit: 'quả' }] }), suggested()] }, [stored()], context);
    assert.equal(result.recipes[0].source, 'culinshare');
    assert.equal(result.recipes[0].recipeId, 42);
    assert.equal(result.recipes[0].authorName, 'Đầu bếp');
    assert.equal(result.recipes[0].matchType, 'similar');
    assert.equal(result.recipes[0].ingredients[0].quantity, 400);
    assert.equal(result.recipes[0].ingredients[1].quantity, 500);
    assert.equal(result.recipes[1].source, 'ai');
    assert.deepEqual(result.shoppingList, ['Trứng gà: 2 quả']);
});

test('names normalize accents and punctuation, while different proteins, dishes and methods are rejected', () => {
    assert.ok(matchScore(suggested({ name: 'PHO BO TAI CHIN!' }), stored(), '45 phút') >= 100);
    for (const title of ['Phở gà tái chín', 'Bún bò tái chín', 'Bò lúc lắc', 'Bò sốt vang']) {
        assert.equal(matchScore(suggested(), stored({ title }), '45 phút'), 0, title);
    }
    assert.equal(matchScore(suggested({ name: 'Thịt bò xào' }), stored({ title: 'Thịt bò kho' }), ''), 0);
    assert.equal(matchScore(suggested({ name: 'Phở bò tái chín đặc biệt', ingredients: [{ name: 'Cá', quantity: 2, unit: 'kg' }] }), stored(), ''), 0);
});

test('time and difficulty break ties, and identical stored recipes are not repeated', () => {
    const recipes = [stored({ id: 2, cook_time_minutes: 90 }), stored({ id: 3 })];
    const preferred = enrichSuggestions({ recipes: [suggested()] }, recipes, context);
    assert.equal(preferred.recipes[0].recipeId, 3);
    const result = enrichSuggestions({ recipes: [suggested(), suggested({ name: 'Phở bò tái chín' })] }, recipes, context);
    assert.equal(result.recipes.length, 1);
    assert.equal(new Set(result.recipes.map(r => r.recipeId)).size, result.recipes.length);
    const single = enrichSuggestions({ recipes: [suggested(), suggested({ name: 'Phở bò tái chín' }), suggested()] }, [stored()], context);
    assert.equal(single.recipes.length, 1);
});

test('shopping list allocates stock once across AI and library recipes, supports mass and volume conversion', () => {
    const result = shoppingPlan([
        { name: 'Món 1', ingredients: [beef(500), { name: 'Sữa', quantity: 0.5, unit: 'l' }] },
        { name: 'Món 2', ingredients: [beef(1000), { name: 'Sữa', quantity: 250, unit: 'ml' }] },
    ], [{ name: 'Bò', quantity: '1kg' }, { name: 'Sữa', quantity: '0,5 l' }]);
    assert.deepEqual(result.shoppingList, ['Thịt bò: 500 g', 'Sữa: 250 ml']);
    assert.deepEqual(result.recipes[1].fridgeIngredientsUsed, ['Thịt bò: 500 g']);
    assert.deepEqual(result.recipes[1].additionalIngredientsNeeded, ['Thịt bò: 500 g', 'Sữa: 250 ml']);
});

test('incompatible units are never subtracted; fractions and unknown quantities are handled explicitly', () => {
    const result = shoppingPlan([{ name: 'Món', ingredients: [beef(200), { name: 'Dầu ăn', quantity: '1/2', unit: 'thìa' }, { name: 'Muối', quantity: 'vừa đủ' }] }], [{ name: 'Bò', quantity: '2 quả' }]);
    assert.deepEqual(result.shoppingList, ['Thịt bò: 200 g', 'Dầu ăn: 0.5 thìa', 'Kiểm tra định lượng Muối (Món)']);
    const unknownStock = shoppingPlan([{ name: 'Món', ingredients: [beef(200)] }], [{ name: 'Bò', quantity: 'một ít' }]);
    assert.deepEqual(unknownStock.shoppingList, ['Kiểm tra định lượng Thịt bò (Món)']);
});

test('missing original servings and legacy AI output do not reuse stale shopping totals', () => {
    const result = enrichSuggestions({ recipes: [suggested()], shoppingList: ['Old AI total'] }, [stored({ servings: 0 })], context);
    assert.equal(result.recipes[0].quantityNeedsReview, true);
    assert.ok(result.shoppingList.every(item => item.startsWith('Kiểm tra định lượng')));
    const legacy = enrichSuggestions([suggested({ name: 'Món chưa có', ingredients: null })], [], context);
    assert.equal(legacy.recipes[0].source, 'ai');
    assert.deepEqual(legacy.shoppingList, ['Kiểm tra nguyên liệu và định lượng cho món Món chưa có']);
});

test('published candidate query has no pagination cap and excludes unpublished ingredients', async t => {
    const pool = require('../backend/src/config/database');
    const repository = require('../backend/src/repositories/recipe.repository');
    const queries = [];
    t.mock.method(pool, 'query', async sql => {
        queries.push(sql);
        return queries.length === 1 ? [[stored({ id: 77 })]] : [[{ recipe_id: 77, ...beef(200) }]];
    });
    const candidates = await repository.findPublishedForMatching();
    assert.equal(candidates[0].ingredients[0].name, 'Thịt bò');
    assert.equal(queries.length, 2);
    assert.ok(queries.every(sql => sql.includes("r.status = 'published'") && !sql.includes('LIMIT')));
});

test('fridge API integrates stored matches and recalculates the meal shopping list', async t => {
    const pool = require('../backend/src/config/database');
    // admin.repository initializes a table on import; keep that import offline too.
    t.mock.method(pool, 'query', async sql => {
        assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS ai_logs'));
        return [[]];
    });
    const ai = require('../backend/src/services/ai.service');
    const repository = require('../backend/src/repositories/recipe.repository');
    const admin = require('../backend/src/repositories/admin.repository');
    const controller = require('../backend/src/controllers/ai.controller');
    t.mock.method(ai, 'getFridgeSuggestions', async () => ({ recipes: [suggested()], shoppingList: ['stale'] }));
    t.mock.method(repository, 'findPublishedForMatching', async () => [stored()]);
    t.mock.method(admin, 'logAiUsage', async () => {});
    let status, body;
    const res = { status(code) { status = code; return this; }, json(data) { body = data; return this; } };
    await controller.suggestRecipesFromFridge({ body: { ...context, dishCount: 1 }, user: { id: 1 } }, res, error => { throw error; });
    assert.equal(status, 200);
    assert.equal(body.data.recipes[0].recipeId, 42);
    assert.deepEqual(body.data.shoppingList, []);
    await controller.suggestRecipesFromFridge({ body: { ...context, peopleCount: 0, dishCount: 1 }, user: { id: 1 } }, res, error => { throw error; });
    assert.equal(status, 400);
});

test('traditional beef pho matches rare beef pho, but chicken and stir-fried pho do not', () => {
    const traditional = stored({ title: 'Phở bò truyền thống', ingredients: [
        { name: 'Thịt thăn bò tái', quantity: 300, unit: 'g' },
        { name: 'Bánh phở tươi', quantity: 1, unit: 'kg' },
        { name: 'Xương ống bò', quantity: 2, unit: 'kg' },
    ] });
    const result = enrichSuggestions({ recipes: [suggested()] }, [traditional], context);
    assert.equal(result.recipes[0].recipeId, 42);
    assert.ok(result.shoppingList.includes('Xương ống bò: 1000 g'));
    assert.equal(matchScore(suggested(), stored({ title: 'Phở bò tái chín xào' }), ''), 0);
    assert.equal(matchScore(suggested(), stored({ title: 'Phở gà tái chín' }), ''), 0);
});
