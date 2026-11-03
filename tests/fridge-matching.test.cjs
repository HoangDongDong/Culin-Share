const { test } = require('node:test');
const assert = require('node:assert/strict');
const { shoppingPlan, storedSuggestion } = require('../backend/src/services/fridgeMatching.service');
const beef = quantity => ({ name: 'Thịt bò', quantity, unit: 'g' });

test('planner allocates stock once and converts mass and volume', () => {
 const result = shoppingPlan([
  { name: 'Món 1', ingredients: [beef(500), { name: 'Sữa', quantity: 0.5, unit: 'l' }] },
  { name: 'Món 2', ingredients: [beef(1000), { name: 'Sữa', quantity: 250, unit: 'ml' }] },
 ], [{ name: 'Thịt bò', quantity: '1kg' }, { name: 'Sữa', quantity: '0,5 l' }]);
 assert.deepEqual(result.shoppingList, ['500 g Thịt bò', '250 ml Sữa']);
 assert.deepEqual(result.recipes[1].fridgeIngredientsUsed, ['500 g Thịt bò']);
});

test('planner uses semantic identity supplied by RAG instead of hardcoded synonyms', () => {
 const result = shoppingPlan([{ name: 'Món', ingredients: [{ name: 'Tên địa phương A', quantity: 50, unit: 'g' }] }],
  [{ name: 'Tên địa phương B', quantity: '50g' }], () => 'verified-semantic-identity');
 assert.deepEqual(result.shoppingList, []);
});

test('incompatible units, unknown stock and fractions remain explicit', () => {
 const result = shoppingPlan([{ name: 'Món', ingredients: [beef(200), { name: 'Dầu ăn', quantity: '1/2', unit: 'thìa' }, { name: 'Muối', quantity: 'vừa đủ' }] }], [{ name: 'Thịt bò', quantity: '2 quả' }]);
 assert.deepEqual(result.shoppingList, ['200 g Thịt bò']);
 const unknown = shoppingPlan([{ name: 'Món', ingredients: [beef(200)] }], [{ name: 'Thịt bò', quantity: 'một ít' }]);
 assert.deepEqual(unknown.shoppingList, ['Kiểm tra định lượng Thịt bò (Món)']);
});

test('source portions scale and decimal labels round safely', () => {
 const recipe = storedSuggestion({ id: 1, title: 'Món', servings: 3, ingredients: [beef(800)] }, 1, { matchType: 'rag' });
 assert.deepEqual(shoppingPlan([recipe], []).shoppingList, ['266.67 g Thịt bò']);
 const unknown = storedSuggestion({ id: 1, title: 'Món', servings: 0, ingredients: [beef(800)] }, 1, {});
 assert.equal(unknown.quantityNeedsReview, true);
 assert.deepEqual(shoppingPlan([unknown], []).shoppingList, ['Kiểm tra định lượng Thịt bò (Món)']);
});

test('legacy spoon unit fragments can still be measured without ingredient synonym rules', () => {
 const key = name => name.replace(/^canh /, '').toLowerCase();
 const result = shoppingPlan([{ name: 'Món', ingredients: [{ name: 'Nước mắm ngon', quantity: 3, unit: 'thìa canh' }] }],
 [{ name: 'canh Nước mắm ngon', quantity: '3 thìa' }], key);
 assert.deepEqual(result.shoppingList, []);
});
