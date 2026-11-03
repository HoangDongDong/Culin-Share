const repository = require('../repositories/recipe.repository');
const embeddings = require('./embedding.service');
const ai = require('./ai.service');
const { shoppingPlan, storedSuggestion, normalize } = require('./fridgeMatching.service');

// No ingredient synonym dictionary: equivalence is grounded in retrieved context.
const identity = name => String(name || '').normalize('NFC').toLocaleLowerCase('vi').replace(/\s+/g, ' ').trim();
const document = recipe => JSON.stringify({ title: recipe.title, description: String(recipe.description || '').slice(0, 1000),
    ingredients: recipe.ingredients.map(item => ({ name: item.name, quantity: item.quantity, unit: item.unit })),
    servings: recipe.servings, difficulty: recipe.difficulty,
    prepTime: recipe.prep_time_minutes, cookTime: recipe.cook_time_minutes });

class FridgeRagService {
    async retrieve(options) {
        const candidates = (await repository.findPublishedForMatching()).filter(recipe => recipe.ingredients?.length);
        if (!candidates.length) return [];
        const vectors = await embeddings.embed(candidates.map(document), 'RETRIEVAL_DOCUMENT');
        const query = `Tìm món ăn nấu được từ nguyên liệu: ${options.ingredients.map(item => item.name).join(', ')}. ${options.peopleCount} người; ${options.cookingSpeed}; ${options.complexity}.`;
        // User fridge queries are never persisted in the catalog vector cache.
        const [queryVector] = await embeddings.embed([query], 'RETRIEVAL_QUERY', { cache: false });
        const fridgeTokens = new Set(normalize(options.ingredients.map(item => item.name).join(' ')).split(' '));
        return candidates.map((recipe, index) => {
            const words = new Set(normalize(recipe.ingredients.map(item => item.name).join(' ')).split(' '));
            const lexical = [...words].filter(word => fridgeTokens.has(word)).length / Math.max(1, words.size);
            return { ...recipe, retrievalScore: embeddings.cosine(queryVector, vectors[index]) * 0.8 + lexical * 0.2 };
        }).sort((a, b) => b.retrievalScore - a.retrievalScore || a.id - b.id).slice(0, 12);
    }

    async suggest(options) {
        const context = await this.retrieve(options);
        const generated = await ai.getFridgeSuggestions({ ...options, retrievedRecipes: context });
        return this.assemble(generated, context, options);
    }

    assemble(generated, context, options) {
        if (!Array.isArray(generated?.recipes)) throw Object.assign(new Error('Phản hồi gợi ý món không hợp lệ.'), { statusCode: 502 });
        const byId = new Map(context.map(recipe => [recipe.id, recipe]));
        const parents = new Map();
        const root = value => {
            if (!parents.has(value)) parents.set(value, value);
            if (parents.get(value) !== value) parents.set(value, root(parents.get(value)));
            return parents.get(value);
        };
        const keyFor = name => root(identity(name));
        const accepted = new Map();
        const exactStockNames = new Set(options.ingredients.map(item => identity(item.name)));
        for (const match of Array.isArray(generated.ingredientMatches) ? generated.ingredientMatches : []) {
            const recipe = byId.get(match.recipeId);
            if (!recipe || !Number.isInteger(match.ingredientIndex) || !Number.isInteger(match.fridgeIndex) ||
                !recipe.ingredients[match.ingredientIndex] || !options.ingredients[match.fridgeIndex] ||
                !Number.isFinite(match.confidence) || match.confidence < 0.9 || match.confidence > 1) continue;
            const catalogKey = identity(recipe.ingredients[match.ingredientIndex].name);
            if (exactStockNames.has(catalogKey)) continue;
            if (!accepted.has(catalogKey)) accepted.set(catalogKey, new Set());
            accepted.get(catalogKey).add(identity(options.ingredients[match.fridgeIndex].name));
        }
        // Conflicting equivalences stay unresolved; do not silently merge foods.
        for (const [catalogKey, fridgeKeys] of accepted) {
            if (fridgeKeys.size === 1) parents.set(root(catalogKey), root([...fridgeKeys][0]));
        }
        const stockNames = new Set(options.ingredients.map(item => keyFor(item.name)));
        const coverage = recipe => {
            const names = new Set(recipe.ingredients.map(item => keyFor(item.name)));
            const matched = [...names].filter(key => stockNames.has(key)).length;
            return { matchedIngredientCount: matched, totalIngredientCount: names.size,
                ingredientCoverage: names.size ? matched / names.size : 0 };
        };
        const chosen = new Map(), aiRecipes = [], aiNames = new Set();
        for (const suggestion of generated.recipes) {
            if (suggestion.sourceRecipeId !== null && suggestion.sourceRecipeId !== undefined) {
                const recipe = byId.get(suggestion.sourceRecipeId);
                // A fabricated or non-retrieved ID is never displayed as a real recipe.
                if (recipe) chosen.set(recipe.id, recipe);
                continue;
            }
            if (typeof suggestion.name !== 'string' || !suggestion.name.trim() || aiNames.has(identity(suggestion.name)) ||
                !Array.isArray(suggestion.ingredients) || !suggestion.ingredients.length ||
                !suggestion.ingredients.every(item => item && typeof item.name === 'string' && item.name.trim() && Number.isFinite(item.quantity) && item.quantity > 0 && typeof item.unit === 'string') ||
                !Array.isArray(suggestion.steps) || !suggestion.steps.every(step => typeof step === 'string')) continue;
            aiNames.add(identity(suggestion.name));
            aiRecipes.push({ name: suggestion.name, description: suggestion.description, source: 'ai',
                ingredients: suggestion.ingredients, steps: suggestion.steps, difficulty: suggestion.difficulty,
                prepTime: Number(suggestion.prepTime) || 0, cookTime: Number(suggestion.cookTime) || 0 });
        }
        for (const recipe of context) if (coverage(recipe).ingredientCoverage >= 0.5) chosen.set(recipe.id, recipe);
        const usedNames = new Set();
        const stored = [...chosen.values()].map(recipe => storedSuggestion(recipe, options.peopleCount, {
            matchType: 'rag', ...coverage(recipe), retrievalScore: recipe.retrievalScore,
        })).sort((a, b) => b.ingredientCoverage - a.ingredientCoverage || b.retrievalScore - a.retrievalScore)
            .filter(recipe => { const key = identity(recipe.name); if (usedNames.has(key)) return false; usedNames.add(key); return true; });
        const recipes = [...stored, ...aiRecipes.filter(recipe => !usedNames.has(identity(recipe.name)))].slice(0, options.dishCount);
        if (!recipes.length) throw Object.assign(new Error('Chưa tìm được món phù hợp. Vui lòng thử điều chỉnh nguyên liệu.'), { statusCode: 502 });
        return { ...shoppingPlan(recipes, options.ingredients, keyFor), retrieval: {
            method: 'rag', retrievedCount: context.length, ingredientMatching: 'semantic-estimate',
        } };
    }
}

module.exports = new FridgeRagService();
module.exports.FridgeRagService = FridgeRagService;
