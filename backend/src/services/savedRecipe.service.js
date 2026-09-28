const savedRecipeRepository = require('../repositories/savedRecipe.repository');

class SavedRecipeService {
    async getSavedRecipes(userId) {
        return await savedRecipeRepository.findAllByUserId(userId);
    }

    async saveRecipe(userId, recipeId) {
        await savedRecipeRepository.create(userId, recipeId);
        return { saved: true };
    }

    async unsaveRecipe(userId, recipeId) {
        await savedRecipeRepository.delete(userId, recipeId);
        return { saved: false };
    }

    async checkSavedStatus(userId, recipeId) {
        const isSaved = await savedRecipeRepository.isSaved(userId, recipeId);
        return { saved: isSaved };
    }
}

module.exports = new SavedRecipeService();
