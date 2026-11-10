const savedRecipeRepository = require('../repositories/savedRecipe.repository');
const { publishedRecipe } = require('./resourceSecurity');

class SavedRecipeService {
    async getSavedRecipes(userId, collectionName = null) {
        const recipes = await savedRecipeRepository.findAllByUserId(userId, collectionName);
        const counts = await savedRecipeRepository.getCollectionCounts(userId);
        return { recipes, counts };
    }

    async saveRecipe(userId, recipeId, collectionName = 'want_to_try') {
        await publishedRecipe(recipeId);
        await savedRecipeRepository.create(userId, recipeId, collectionName);
        return { saved: true, collection: collectionName };
    }

    async updateCollection(userId, recipeId, collectionName) {
        await publishedRecipe(recipeId);
        await savedRecipeRepository.updateCollection(userId, recipeId, collectionName);
        return { saved: true, collection: collectionName };
    }

    async unsaveRecipe(userId, recipeId) {
        await savedRecipeRepository.delete(userId, recipeId);
        return { saved: false };
    }

    async checkSavedStatus(userId, recipeId) {
        const result = await savedRecipeRepository.isSaved(userId, recipeId);
        return { saved: result.isSaved, collection: result.collection };
    }
}

module.exports = new SavedRecipeService();
