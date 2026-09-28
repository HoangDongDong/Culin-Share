const savedRecipeService = require('../services/savedRecipe.service');

class SavedRecipeController {
    async getSavedRecipes(req, res, next) {
        try {
            const userId = req.query.userId || req.user.id;
            const recipes = await savedRecipeService.getSavedRecipes(userId);
            return res.status(200).json({
                success: true,
                data: recipes
            });
        } catch (error) {
            next(error);
        }
    }

    async saveRecipe(req, res, next) {
        try {
            const { id: recipeId } = req.params;
            const userId = req.user.id;
            const result = await savedRecipeService.saveRecipe(userId, recipeId);
            return res.status(200).json({
                success: true,
                message: 'Lưu công thức thành công',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async unsaveRecipe(req, res, next) {
        try {
            const { id: recipeId } = req.params;
            const userId = req.user.id;
            const result = await savedRecipeService.unsaveRecipe(userId, recipeId);
            return res.status(200).json({
                success: true,
                message: 'Hủy lưu công thức thành công',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async checkSavedStatus(req, res, next) {
        try {
            const { id: recipeId } = req.params;
            const userId = req.user.id;
            const result = await savedRecipeService.checkSavedStatus(userId, recipeId);
            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SavedRecipeController();
