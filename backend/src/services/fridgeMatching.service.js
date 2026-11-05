// Matching and quantity arithmetic stay deterministic; AI cannot supply database IDs.
const { isBasicPantry } = require('./pantryPolicy');
const {cleanFoodText,cleanRecipeContent}=require('./foodText');
const normalize = value => String(value || '').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
function number(value) {
    if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null;
    const text = String(value ?? '').trim().replace(',', '.');
    if (/^\d+\s*\/\s*\d+$/.test(text)) {
        const [a, b] = text.split('/').map(Number);
        return a > 0 && b > 0 ? a / b : null;
    }
    return /^\d+(\.\d+)?$/.test(text) && Number(text) > 0 ? Number(text) : null;
}
const units = {
    g: ['g', 1], gram: ['g', 1], gam: ['g', 1], kg: ['g', 1000],
    ml: ['ml', 1], l: ['ml', 1000], lit: ['ml', 1000],
    qua: ['quả', 1], trai: ['quả', 1], cu: ['củ', 1],
    thia: ['thìa', 1], muong: ['thìa', 1],
    'thia canh': ['thìa canh', 1], 'muong canh': ['thìa canh', 1],
    'thia ca phe': ['thìa cà phê', 1], 'muong ca phe': ['thìa cà phê', 1],
};
function measure(ingredient) {
    let quantity = ingredient.quantity, unit = ingredient.unit || '';
    if (!unit && typeof quantity === 'string') {
        const match = quantity.trim().match(/^(\d+(?:[.,]\d+)?|\d+\s*\/\s*\d+)\s*([^\d]*)$/);
        if (match) [, quantity, unit] = match;
    }
    const amount = number(quantity);
    let normalizedUnit = normalize(unit);
    // Older ingredient forms sometimes put the rest of a spoon unit in the name.
    if (['thia', 'muong'].includes(normalizedUnit)) {
        const prefix = normalize(ingredient.name).match(/^(canh|ca phe) (?=(nuoc mam|bot nghe|dau an)\b)/);
        if (prefix) normalizedUnit += ` ${prefix[1]}`;
    }
    const [canonical, multiplier] = units[normalizedUnit] || [normalizedUnit, 1];
    return { amount: amount === null ? null : amount * multiplier, unit: canonical };
}
const rounded = value => Math.round((value + Number.EPSILON) * 100) / 100;
const label = (name, amount, unit) => `${rounded(amount)}${unit ? ` ${unit}` : ''} ${name}`.trim();

function shoppingPlan(recipes, fridgeItems, keyFor = name => String(name || "").normalize("NFC").toLowerCase().trim()) {
    recipes=recipes.map(cleanRecipeContent);
    fridgeItems=fridgeItems.map(item=>item&&typeof item==='object'?{...item,name:cleanFoodText(item.name)}:item);
    const required = new Map(), available = new Map(), uncertain = new Set();
    const unmeasuredStock = new Set();
    for (const item of fridgeItems) {
        if (!item || typeof item !== 'object') continue;
        const measurement = measure(item);
        if (measurement.amount === null) { unmeasuredStock.add(keyFor(item.name)); continue; }
        const key = `${keyFor(item.name)}|${measurement.unit}`;
        available.set(key, (available.get(key) || 0) + measurement.amount);
    }
    const planned = recipes.map(recipe => {
        const used = [], missing = [], pantryIngredients = [];
        if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
            const note = `Kiểm tra nguyên liệu và định lượng cho món ${recipe.name}`;
            uncertain.add(note);
            return { ...recipe, fridgeIngredientsUsed: [], additionalIngredientsNeeded: [note] };
        }
        for (const ingredient of recipe.ingredients) {
            // Keep staples in the actual recipe, but never request buying or checking their quantity.
            if (isBasicPantry(ingredient.name)) { pantryIngredients.push(ingredient); continue; }
            const measurement = measure(ingredient);
            if (measurement.amount === null || recipe.quantityNeedsReview || unmeasuredStock.has(keyFor(ingredient.name))) {
                const note = `Kiểm tra định lượng ${ingredient.name} (${recipe.name})`;
                uncertain.add(note); missing.push(note); continue;
            }
            const key = `${keyFor(ingredient.name)}|${measurement.unit}`;
            const entry = required.get(key) || { name: ingredient.name, amount: 0, unit: measurement.unit };
            entry.amount += measurement.amount;
            required.set(key, entry);
            const stock = available.get(key) || 0;
            const consumed = Math.min(stock, measurement.amount);
            available.set(key, stock - consumed);
            if (consumed > 0) used.push(label(ingredient.name, consumed, measurement.unit));
            if (consumed < measurement.amount) missing.push(label(ingredient.name, measurement.amount - consumed, measurement.unit));
        }
        return { ...recipe, fridgeIngredientsUsed: used, additionalIngredientsNeeded: missing, pantryIngredients };
    });
    // Sum shortages after allocating the fridge once across the entire meal.
    const shortages = [];
    for (const [key, entry] of required) {
        let stock = 0;
        for (const item of fridgeItems) {
            if (!item || typeof item !== 'object') continue;
            const m = measure(item);
            if (`${keyFor(item.name)}|${m.unit}` === key && m.amount !== null) stock += m.amount;
        }
        if (entry.amount > stock) shortages.push(label(entry.name, entry.amount - stock, entry.unit));
    }
    return { recipes: planned, shoppingList: [...shortages, ...uncertain] };
}

function storedSuggestion(candidate, peopleCount, metadata) {
    const servings = number(candidate.servings);
    const ratio = servings ? peopleCount / servings : 1;
    return {
        name: candidate.title, description: candidate.description,
        prepTime: Number(candidate.prep_time_minutes) || 0, cookTime: Number(candidate.cook_time_minutes) || 0,
        difficulty: candidate.difficulty, source: 'culinshare', recipeId: candidate.id,
        coverImageUrl: candidate.cover_image_url, authorName: candidate.author_name,
        servings: peopleCount, quantityNeedsReview: !servings, ...metadata,
        ingredients: candidate.ingredients.map(ingredient => {
            const m = measure(ingredient);
            return m.amount === null ? { ...ingredient } : { name: ingredient.name, quantity: m.amount * ratio, unit: m.unit };
        }),
    };
}


module.exports = { shoppingPlan, storedSuggestion, normalize };
