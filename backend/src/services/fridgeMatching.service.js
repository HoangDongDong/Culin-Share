// Matching and quantity arithmetic stay deterministic; AI cannot supply database IDs.
const normalize = value => String(value || '').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const aliases = new Map([
    ['bo', 'thit bo'], ['heo', 'thit heo'], ['thit lon', 'thit heo'],
    ['lon', 'thit heo'], ['ga', 'thit ga'], ['pho', 'banh pho'],
    ['dau hu', 'dau phu'], ['trung', 'trung ga'], ['tom tuoi', 'tom'],
]);
const ingredientKey = name => {
    const text = normalize(name).replace(/\s+tuoi$/, '');
    // Meat cuts may use the user's generic meat entry, but bones remain separate.
    if (/^thit\b.*\bbo\b/.test(text)) return 'thit bo';
    if (/^thit\b.*\b(heo|lon)\b/.test(text)) return 'thit heo';
    if (/^thit\b.*\bga\b/.test(text)) return 'thit ga';
    return aliases.get(text) || text;
};
const tokens = name => new Set(normalize(name).split(' ').filter(Boolean));
const dice = (a, b) => a.size && b.size
    ? 2 * [...a].filter(token => b.has(token)).length / (a.size + b.size) : 0;
const methods = ['xao', 'kho', 'nuong', 'chien', 'hap', 'ham', 'luoc'];
const proteins = ['bo', 'ga', 'heo', 'lon', 'ca', 'tom', 'muc'];
const families = ['pho', 'bun', 'com', 'chao', 'canh', 'lau', 'banh'];
function conflicts(a, b, group) {
    const left = group.filter(word => a.has(word));
    const right = group.filter(word => b.has(word));
    return left.length && right.length && !left.some(word => right.includes(word));
}

function matchScore(suggestion, candidate, cookingSpeed) {
    const a = tokens(suggestion.name), b = tokens(candidate.title);
    const suggestedIngredients = Array.isArray(suggestion.ingredients) ? suggestion.ingredients : [];
    const proteinEvidence = tokens([suggestion.name, ...suggestedIngredients.map(i => ingredientKey(i.name))].join(' ').replace(/trung ga/g, 'trung'));
    if ([methods, families].some(group => conflicts(a, b, group)) || conflicts(proteinEvidence, b, proteins)) return 0;
    const exact = normalize(suggestion.name) === normalize(candidate.title);
    let similarity = dice(a, b);
    if (a.has('pho') && b.has('pho') && ['xao', 'chien', 'cuon'].some(word => a.has(word) !== b.has(word))) return 0;
    // Traditional beef pho and rare/well-done beef pho share a dish family.
    // Fried/stir-fried/rolled pho must not be substituted for noodle soup.
    if (a.has('pho') && b.has('pho') && proteinEvidence.has('bo') && b.has('bo') &&
        ['xao', 'chien', 'cuon'].every(word => a.has(word) === b.has(word))) similarity = Math.max(similarity, 0.85);
    const needed = new Set(suggestedIngredients.map(i => ingredientKey(i.name)));
    const stored = new Set(candidate.ingredients.map(i => ingredientKey(i.name)));
    const overlap = needed.size ? [...needed].filter(key => stored.has(key)).length / needed.size : 0;
    if (!exact && (similarity < 0.75 || overlap < 0.5)) return 0;
    const minutes = Number.parseInt(cookingSpeed, 10);
    const timeFits = Number.isFinite(minutes) && Number(candidate.prep_time_minutes) + Number(candidate.cook_time_minutes) <= minutes;
    return (exact ? 100 : similarity * 70 + overlap * 20)
        + (timeFits ? 3 : 0) + (normalize(candidate.difficulty) === normalize(suggestion.difficulty) ? 2 : 0);
}

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
    const normalizedUnit = normalize(unit);
    const [canonical, multiplier] = units[normalizedUnit] || [normalizedUnit, 1];
    return { amount: amount === null ? null : amount * multiplier, unit: canonical };
}
const rounded = value => Math.round(value * 100) / 100;
const label = (name, amount, unit) => `${name}: ${rounded(amount)}${unit ? ` ${unit}` : ''}`;

function shoppingPlan(recipes, fridgeItems) {
    const required = new Map(), available = new Map(), uncertain = new Set();
    const unmeasuredStock = new Set();
    for (const item of fridgeItems) {
        if (!item || typeof item !== 'object') continue;
        const measurement = measure(item);
        if (measurement.amount === null) { unmeasuredStock.add(ingredientKey(item.name)); continue; }
        const key = `${ingredientKey(item.name)}|${measurement.unit}`;
        available.set(key, (available.get(key) || 0) + measurement.amount);
    }
    const planned = recipes.map(recipe => {
        const used = [], missing = [];
        if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
            const note = `Kiểm tra nguyên liệu và định lượng cho món ${recipe.name}`;
            uncertain.add(note);
            return { ...recipe, fridgeIngredientsUsed: [], additionalIngredientsNeeded: [note] };
        }
        for (const ingredient of recipe.ingredients) {
            const measurement = measure(ingredient);
            if (measurement.amount === null || recipe.quantityNeedsReview || unmeasuredStock.has(ingredientKey(ingredient.name))) {
                const note = `Kiểm tra định lượng ${ingredient.name} (${recipe.name})`;
                uncertain.add(note); missing.push(note); continue;
            }
            const key = `${ingredientKey(ingredient.name)}|${measurement.unit}`;
            const entry = required.get(key) || { name: ingredient.name, amount: 0, unit: measurement.unit };
            entry.amount += measurement.amount;
            required.set(key, entry);
            const stock = available.get(key) || 0;
            const consumed = Math.min(stock, measurement.amount);
            available.set(key, stock - consumed);
            if (consumed > 0) used.push(label(ingredient.name, consumed, measurement.unit));
            if (consumed < measurement.amount) missing.push(label(ingredient.name, measurement.amount - consumed, measurement.unit));
        }
        return { ...recipe, fridgeIngredientsUsed: used, additionalIngredientsNeeded: missing };
    });
    // Sum shortages after allocating the fridge once across the entire meal.
    const shortages = [];
    for (const [key, entry] of required) {
        let stock = 0;
        for (const item of fridgeItems) {
            if (!item || typeof item !== 'object') continue;
            const m = measure(item);
            if (`${ingredientKey(item.name)}|${m.unit}` === key && m.amount !== null) stock += m.amount;
        }
        if (entry.amount > stock) shortages.push(label(entry.name, entry.amount - stock, entry.unit));
    }
    return { recipes: planned, shoppingList: [...shortages, ...uncertain] };
}

function enrichSuggestions(suggestions, candidates, { ingredients, peopleCount, cookingSpeed }) {
    const original = Array.isArray(suggestions) ? suggestions : suggestions?.recipes;
    if (!Array.isArray(original)) throw new Error('Dữ liệu món ăn từ AI không hợp lệ');
    const usedIds = new Set(), usedNames = new Set(), usedRecipeNames = new Set();
    const recipes = [];
    for (const rawSuggestion of original) {
        if (!rawSuggestion || typeof rawSuggestion.name !== 'string' || !rawSuggestion.name.trim()) continue;
        const suggestion = { ...rawSuggestion, ingredients: Array.isArray(rawSuggestion.ingredients)
            ? rawSuggestion.ingredients.filter(item => item && typeof item.name === 'string' && item.name.trim()) : [] };
        const name = normalize(suggestion.name);
        if (usedNames.has(name)) continue;
        usedNames.add(name);
        const matches = candidates.filter(candidate => candidate.ingredients.length)
            .map(candidate => ({ candidate, score: matchScore(suggestion, candidate, cookingSpeed) }))
            .filter(match => match.score > 0).sort((a, b) => b.score - a.score || a.candidate.id - b.candidate.id);
        if (!matches.length) { recipes.push({ ...suggestion, source: 'ai' }); continue; }
        const selected = matches.find(match => !usedIds.has(match.candidate.id) && !usedRecipeNames.has(normalize(match.candidate.title)));
        // Multiple AI variants pointing to the same stored dish should not repeat it.
        if (!selected) continue;
        const { candidate, score } = selected;
        usedIds.add(candidate.id);
        usedRecipeNames.add(normalize(candidate.title));
        const servings = number(candidate.servings);
        const ratio = servings ? peopleCount / servings : 1;
        recipes.push({
            name: candidate.title, description: candidate.description,
            prepTime: Number(candidate.prep_time_minutes) || 0, cookTime: Number(candidate.cook_time_minutes) || 0,
            difficulty: candidate.difficulty, source: 'culinshare', recipeId: candidate.id,
            coverImageUrl: candidate.cover_image_url, authorName: candidate.author_name,
            matchType: normalize(suggestion.name) === normalize(candidate.title) ? 'exact' : 'similar',
            matchScore: score, suggestedName: suggestion.name, servings: peopleCount,
            quantityNeedsReview: !servings,
            ingredients: candidate.ingredients.map(ingredient => {
                const m = measure(ingredient);
                return m.amount === null ? { ...ingredient } : { name: ingredient.name, quantity: m.amount * ratio, unit: m.unit };
            }),
        });
    }
    recipes.sort((a, b) => (b.source === 'culinshare') - (a.source === 'culinshare') || (b.matchScore || 0) - (a.matchScore || 0));
    return shoppingPlan(recipes, ingredients);
}

module.exports = { enrichSuggestions, matchScore, shoppingPlan, normalize };
