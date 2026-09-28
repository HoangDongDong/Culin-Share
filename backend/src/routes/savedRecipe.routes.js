const express = require('express');
const router = express.Router();
const savedRecipeController = require('../controllers/savedRecipe.controller');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/me/saved-recipes', verifyToken, savedRecipeController.getSavedRecipes);
router.post('/recipes/:id/save', verifyToken, savedRecipeController.saveRecipe);
router.delete('/recipes/:id/save', verifyToken, savedRecipeController.unsaveRecipe);
router.get('/recipes/:id/saved-status', verifyToken, savedRecipeController.checkSavedStatus);

module.exports = router;
