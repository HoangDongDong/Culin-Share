const { test } = require('node:test');
const assert = require('node:assert/strict');
const { shoppingPlan } = require('../backend/src/services/fridgeMatching.service');
const { isBasicPantry } = require('../backend/src/services/pantryPolicy');

test('basic pantry staples never appear in either shopping list, but remain visible in the recipe', () => {
    const ingredients = ['Nước mắm', 'Hạt tiêu', 'Muối', 'Đường', 'Dầu ăn', 'Hạt nêm', 'Bột ngọt', 'Nước lọc']
        .map(name => ({ name, quantity: 1, unit: 'thìa' }));
    const result = shoppingPlan([{ name: 'Món thử', ingredients }], []);
    assert.deepEqual(result.shoppingList, []);
    assert.deepEqual(result.recipes[0].additionalIngredientsNeeded, []);
    assert.deepEqual(result.recipes[0].ingredients, ingredients);
    assert.deepEqual(result.recipes[0].pantryIngredients, ingredients);
});

test('unknown seasoning quantity does not become a shopping warning', () => {
    const result = shoppingPlan([{ name: 'Món thử', quantityNeedsReview: true,
        ingredients: [{ name: 'Muối (vừa đủ)', quantity: 'vừa đủ' }, { name: 'Hạt tiêu xay', quantity: null }] }], []);
    assert.deepEqual(result.shoppingList, []);
    assert.deepEqual(result.recipes[0].additionalIngredientsNeeded, []);
});

test('special seasoning, vegetables and main ingredients still have shortages', () => {
    const names = ['Muối tôm', 'Tiêu xanh', 'Dầu mè', 'Đường thốt nốt', 'Nước dùng gà', 'Bột nghệ', 'Nước mắm chay', 'Hành tây', 'Tỏi'];
    for (const name of names) assert.equal(isBasicPantry(name), false, name);
    const result = shoppingPlan([{ name: 'Món thử', ingredients: names.map(name => ({ name, quantity: 1, unit: 'g' })) }], []);
    assert.equal(result.shoppingList.length, names.length);
    assert.equal(result.recipes[0].additionalIngredientsNeeded.length, names.length);
});

test('whole-name policy tolerates case, accents and unit fragments without hiding special ingredients', () => {
    for (const name of ['NƯỚC MẮM NGON', 'hat tieu', 'canh Nước mắm ngon', 'muối tinh', 'xì dầu']) assert.equal(isBasicPantry(name), true, name);
    assert.equal(isBasicPantry('Muối (tôm)'), false);
    const result = shoppingPlan([{ name: 'Bò xào', ingredients: [{ name: 'Muối', quantity: 1, unit: 'g' }, { name: 'Thịt bò', quantity: 300, unit: 'g' }] }], [{ name: 'Thịt bò', quantity: '200g' }]);
    assert.deepEqual(result.shoppingList, ['100 g Thịt bò']);
    assert.deepEqual(result.recipes[0].additionalIngredientsNeeded, ['100 g Thịt bò']);
});
