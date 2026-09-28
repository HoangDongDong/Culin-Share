const categoryRepository = require('../repositories/category.repository');

class CategoryService {
    async getAllCategories() {
        return await categoryRepository.findAll();
    }

    async getCategoryById(id) {
        const category = await categoryRepository.findById(id);
        if (!category) {
            const error = new Error('Không tìm thấy danh mục');
            error.statusCode = 404;
            throw error;
        }
        return category;
    }
}

module.exports = new CategoryService();
