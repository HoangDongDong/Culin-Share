const recipeService = require('../services/recipe.service');

const attachUploadedImages = (body, files = {}) => {
    const data = { ...body };
    const coverFile = files.coverImage?.[0];
    if (coverFile) {
        data.cover_image_url = coverFile.path;
    }

    if (data.steps) {
        const steps = typeof data.steps === 'string' ? JSON.parse(data.steps) : data.steps;
        const indexes = data.stepImageIndexes
            ? JSON.parse(data.stepImageIndexes)
            : [];

        (files.stepImages || []).forEach((file, fileIndex) => {
            const stepIndex = indexes[fileIndex];
            if (steps[stepIndex]) {
                steps[stepIndex].image_url = file.path;
            }
        });
        data.steps = steps;
    }

    return data;
};

class RecipeController {
    async getAllRecipes(req, res, next) {
        try {
            const { category, q, difficulty, sort, author_id, page, limit } = req.query;
            const result = await recipeService.getAllRecipes({ category, query: q, difficulty, sort, author_id, page, limit });
            return res.status(200).json({
                success: true,
                data: result.data,
                meta: result.meta,
            });
        } catch (error) {
            next(error);
        }
    }

    async getRecipeById(req, res, next) {
        try {
            const { id } = req.params;
            const recipe = await recipeService.getRecipeById(id);
            return res.status(200).json({
                success: true,
                data: recipe
            });
        } catch (error) {
            next(error);
        }
    }

    async getRecipeBySlug(req, res, next) {
        try {
            const { slug } = req.params;
            const recipe = await recipeService.getRecipeBySlug(slug);
            return res.status(200).json({
                success: true,
                data: recipe
            });
        } catch (error) {
            next(error);
        }
    }

    async createRecipe(req, res, next) {
        try {
            const authorId = req.user.id;
            const recipe = await recipeService.createRecipe(authorId, attachUploadedImages(req.body, req.files));
            return res.status(201).json({
                success: true,
                message: 'Tạo công thức thành công',
                data: recipe
            });
        } catch (error) {
            next(error);
        }
    }

    async updateRecipe(req, res, next) {
        try {
            const { id } = req.params;
            const authorId = req.user.id;
            const userRole = req.user.role;
            const recipe = await recipeService.updateRecipe(id, authorId, userRole, attachUploadedImages(req.body, req.files));
            return res.status(200).json({
                success: true,
                message: 'Cập nhật công thức thành công',
                data: recipe
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteRecipe(req, res, next) {
        try {
            const { id } = req.params;
            const authorId = req.user.id;
            const userRole = req.user.role;
            await recipeService.deleteRecipe(id, authorId, userRole);
            return res.status(200).json({
                success: true,
                message: 'Xóa công thức thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    async getRecipesRanking(req, res, next) {
        try {
            const ranking = await recipeService.getRecipesRanking();
            return res.status(200).json({
                success: true,
                message: 'Lấy bảng xếp hạng công thức thành công',
                data: ranking
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new RecipeController();
