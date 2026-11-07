const repository = require('../repositories/recipe.repository');
const embeddings = require('./embedding.service');
const ai = require('./ai.service');
const { shoppingPlan, storedSuggestion, normalize } = require('./fridgeMatching.service');
const {cleanFoodText,cleanRecipeContent}=require('./foodText');

// No ingredient synonym dictionary: equivalence is grounded in retrieved context.
const identity = name => String(name || '').normalize('NFC').toLocaleLowerCase('vi').replace(/\s+/g, ' ').trim();
const providerFailure = error => [500, 502, 503].includes(error.statusCode);
const document = recipe => JSON.stringify({ title: recipe.title, description: String(recipe.description || '').slice(0, 1000),
    ingredients: recipe.ingredients.map(item => ({ name: item.name, quantity: item.quantity, unit: item.unit })),
    servings: recipe.servings, difficulty: recipe.difficulty,
    prepTime: recipe.prep_time_minutes, cookTime: recipe.cook_time_minutes });

class FridgeRagService {
    async loadCatalog() {
        return (await repository.findPublishedForMatching())
            .filter(recipe => recipe.ingredients?.length)
            .map(cleanRecipeContent);
    }

    suggestFromCatalog(catalog, options) {
        const available = new Set(options.ingredients.map(item => identity(item.name)));
        const names = new Set();
        const recipes = catalog.map(recipe => {
            const ingredients = new Set(recipe.ingredients.map(item => identity(item.name)).filter(Boolean));
            const matched = [...ingredients].filter(name => available.has(name)).length;
            return { recipe, matched, total: ingredients.size };
        }).filter(entry => entry.matched > 0)
            .sort((a, b) => b.matched - a.matched || a.total - b.total || a.recipe.id - b.recipe.id)
            .filter(({ recipe }) => {
                const name = identity(recipe.title);
                if (names.has(name)) return false;
                names.add(name);
                return true;
            })
            .slice(0, options.dishCount)
            .map(({ recipe, matched, total }) => storedSuggestion(recipe, options.peopleCount, {
                matchType: 'ingredients',
                matchedIngredientCount: matched,
                totalIngredientCount: total,
                ingredientCoverage: matched / total,
            }));
        if (!recipes.length) {
            throw Object.assign(new Error('Chưa tìm thấy món trong kho khớp nguyên liệu. Bạn thử thêm hoặc đổi nguyên liệu nhé.'), { statusCode: 422 });
        }
        return { ...shoppingPlan(recipes, options.ingredients), retrieval: {
            method: 'catalog', retrievedCount: recipes.length, ingredientMatching: 'exact-name',
        } };
    }

    async retrieve(options, catalog) {
        options={...options,ingredients:options.ingredients.map(i=>({...i,name:cleanFoodText(i.name)}))};
        let candidates = catalog ?? await this.loadCatalog();
        if (!candidates.length) return [];
        // Bound embedding work after a bulk import. This coarse pass uses actual
        // ingredient text, not a hand-written synonym dictionary. Semantic ranking
        // remains the second pass and the LLM still sees at most 12 recipes.
        const stockWords=new Set(normalize(options.ingredients.map(item=>item.name).join(' ')).split(' ').filter(Boolean));
        if(candidates.length>128)candidates=candidates.map(recipe=>{
            const words=new Set(normalize(recipe.ingredients.map(item=>item.name).join(' ')).split(' '));
            const overlap=[...stockWords].filter(word=>words.has(word)).length;
            return {recipe,score:overlap/Math.max(1,stockWords.size)};
        }).sort((a,b)=>b.score-a.score||a.recipe.id-b.recipe.id).slice(0,128).map(item=>item.recipe);
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
        options={...options,ingredients:options.ingredients.map(i=>({...i,name:cleanFoodText(i.name)}))};
        const catalog = await this.loadCatalog();
        try {
            const context = await this.retrieve(options, catalog);
            const generated = await ai.getFridgeSuggestions({ ...options, retrievedRecipes: context });
            return this.assemble(generated, context, options);
        } catch (error) {
            if (!providerFailure(error) || !catalog.length) throw error;
            console.warn('Gợi ý tủ lạnh chuyển sang kho công thức:', error.statusCode);
            return this.suggestFromCatalog(catalog, options);
        }
    }

    assemble(generated, context, options) {
        if (!Array.isArray(generated?.recipes)) throw Object.assign(new Error('Phản hồi gợi ý món không hợp lệ.'), { statusCode: 502 });
        context=context.map(cleanRecipeContent);
        generated={...generated,recipes:generated.recipes.map(cleanRecipeContent)};
        options={...options,ingredients:options.ingredients.map(i=>({...i,name:cleanFoodText(i.name)}))};
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
            if (!match || typeof match !== 'object') continue;
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
            if (!suggestion || typeof suggestion !== 'object') continue;
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
