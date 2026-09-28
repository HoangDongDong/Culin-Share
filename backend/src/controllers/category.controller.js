const categoryService = require('../services/category.service');

class CategoryController {
    async getAllCategories(req, res, next) {
        try {
            const categories = await categoryService.getAllCategories();
            return res.status(200).json({
                success: true,
                data: categories
            });
        } catch (error) {
            next(error);
        }
    }

    async getCategoryById(req, res, next) {
        try {
            const { id } = req.params;
            const category = await categoryService.getCategoryById(id);
            return res.status(200).json({
                success: true,
                data: category
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new CategoryController();
