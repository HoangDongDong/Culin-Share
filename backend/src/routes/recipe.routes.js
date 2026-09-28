const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipe.controller');
const { verifyToken } = require('../middlewares/authMiddleware');
const { validateRecipe } = require('../middlewares/inputValidationMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const uploadRecipeImages = (req, res, next) => {
    upload.fields([
        { name: 'coverImage', maxCount: 1 },
        { name: 'stepImages', maxCount: 20 }
    ])(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        next();
    });
};

router.get('/recipes', recipeController.getAllRecipes);
router.get('/recipes/ranking', recipeController.getRecipesRanking);
router.get('/recipes/:id', recipeController.getRecipeById);
router.get('/recipes/slug/:slug', recipeController.getRecipeBySlug);
router.post('/recipes', verifyToken, uploadRecipeImages, validateRecipe, recipeController.createRecipe);
router.put('/recipes/:id', verifyToken, uploadRecipeImages, validateRecipe, recipeController.updateRecipe);
router.delete('/recipes/:id', verifyToken, recipeController.deleteRecipe);

module.exports = router;
