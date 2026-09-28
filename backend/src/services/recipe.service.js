const recipeRepository = require('../repositories/recipe.repository');
const commentRepository = require('../repositories/comment.repository');
const followService = require('./follow.service');
const notificationService = require('./notification.service');
const userRepository = require('../repositories/user.repository');

class RecipeService {
    generateSlug(title) {
        let slug = title.toLowerCase()
            .replace(/[áàảãạăắằẳẵặâấầẩẫậ]/g, 'a')
            .replace(/[éèẻẽẹêếềểễệ]/g, 'e')
            .replace(/[íìỉĩị]/g, 'i')
            .replace(/[óòỏõọôốồổỗộơớờởỡợ]/g, 'o')
            .replace(/[úùủũụưứừửữự]/g, 'u')
            .replace(/[ýỳỷỹỵ]/g, 'y')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
        return `${slug}-${Date.now().toString().slice(-6)}`;
    }

    async getAllRecipes(filters = {}) {
        return await recipeRepository.findAll(filters);
    }

    async getRecipeDetail(recipe) {
        if (!recipe) return null;
        const recipeId = recipe.id;

        const ingredients = await recipeRepository.getIngredients(recipeId);
        const steps = await recipeRepository.getSteps(recipeId);
        const images = await recipeRepository.getImages(recipeId);
        const categories = await recipeRepository.getCategories(recipeId);
        const rawComments = await commentRepository.findByRecipeId(recipeId);

        // Build hierarchical comments
        const comments = [];
        const commentMap = {};
        rawComments.forEach(c => {
            c.replies = [];
            commentMap[c.id] = c;
        });
        rawComments.forEach(c => {
            if (c.parent_id && commentMap[c.parent_id]) {
                commentMap[c.parent_id].replies.push(c);
            } else {
                comments.push(c);
            }
        });

        // Add aliases for camelCase compatibility with frontend
        const detail = {
            ...recipe,
            averageRating: parseFloat(recipe.average_rating) || 0,
            reviewCount: parseInt(recipe.review_count) || 0,
            coverImageUrl: recipe.cover_image_url,
            videoUrl: recipe.video_url,
            prepTimeMinutes: recipe.prep_time_minutes,
            cookTimeMinutes: recipe.cook_time_minutes,
            ingredients,
            steps,
            images,
            categories,
            comments
        };

        return detail;
    }

    async getRecipeById(id) {
        const recipe = await recipeRepository.findById(id);
        if (!recipe) {
            const error = new Error('Không tìm thấy công thức nấu ăn');
            error.statusCode = 404;
            throw error;
        }
        return await this.getRecipeDetail(recipe);
    }

    async getRecipeBySlug(slug) {
        const recipe = await recipeRepository.findBySlug(slug);
        if (!recipe) {
            const error = new Error('Không tìm thấy công thức nấu ăn');
            error.statusCode = 404;
            throw error;
        }
        return await this.getRecipeDetail(recipe);
    }

    async createRecipe(authorId, data) {
        const slug = this.generateSlug(data.title);
        const recipeData = {
            author_id: authorId,
            title: data.title,
            slug,
            description: data.description,
            cover_image_url: data.cover_image_url || data.coverImageUrl,
            video_url: data.video_url || data.videoUrl,
            prep_time_minutes: parseInt(data.prep_time_minutes || data.prepTimeMinutes) || 0,
            cook_time_minutes: parseInt(data.cook_time_minutes || data.cookTimeMinutes) || 0,
            servings: parseInt(data.servings) || 0,
            calories: parseInt(data.calories) || 0,
            difficulty: data.difficulty || 'dễ',
            status: data.status || 'pending'
        };

        const recipeId = await recipeRepository.create(recipeData);

        // Save related details
        if (data.ingredients) {
            const ingredients = typeof data.ingredients === 'string' ? JSON.parse(data.ingredients) : data.ingredients;
            // Map plain strings (like from frontend sometimes) to {name, quantity, unit} objects
            const formattedIng = ingredients.map(ing => {
                if (typeof ing === 'string') return { name: ing };
                return ing;
            });
            await recipeRepository.saveIngredients(recipeId, formattedIng);
        }

        if (data.steps) {
            const steps = typeof data.steps === 'string' ? JSON.parse(data.steps) : data.steps;
            await recipeRepository.saveSteps(recipeId, steps);
        }

        if (data.images) {
            const images = typeof data.images === 'string' ? JSON.parse(data.images) : data.images;
            await recipeRepository.saveImages(recipeId, images);
        }

        if (data.categoryIds || data.categories) {
            const categories = data.categoryIds || data.categories;
            const categoryIds = typeof categories === 'string' ? JSON.parse(categories) : categories;
            await recipeRepository.linkCategories(recipeId, categoryIds);
        }

        const newRecipe = await this.getRecipeById(recipeId);

        // Phát thông báo cho followers của đầu bếp
        try {
            const author = await userRepository.findById(authorId);
            const authorName = author?.full_name || author?.username || 'Đầu bếp';
            const followers = await followService.getFollowers(authorId);

            for (const follower of followers) {
                await notificationService.createAndNotify({
                    userId: follower.id,
                    senderId: authorId,
                    type: 'new_recipe',
                    recipeId: recipeId,
                    message: `đã đăng công thức mới: "${data.title}"`
                });
            }
        } catch (error) {
            console.error('❌ Lỗi gửi thông báo cho followers khi đăng công thức mới:', error.message);
        }

        return newRecipe;
    }

    async updateRecipe(id, authorId, userRole, data) {
        const recipe = await recipeRepository.findById(id);
        if (!recipe) {
            const error = new Error('Không tìm thấy công thức nấu ăn');
            error.statusCode = 404;
            throw error;
        }

        if (recipe.author_id !== authorId && userRole !== 'admin') {
            const error = new Error('Bạn không có quyền chỉnh sửa công thức này');
            error.statusCode = 403;
            throw error;
        }

        const slug = data.title !== recipe.title ? this.generateSlug(data.title) : recipe.slug;
        const recipeData = {
            title: data.title || recipe.title,
            slug,
            description: data.description !== undefined ? data.description : recipe.description,
            cover_image_url: data.cover_image_url !== undefined ? data.cover_image_url : (data.coverImageUrl !== undefined ? data.coverImageUrl : recipe.cover_image_url),
            video_url: data.video_url !== undefined ? data.video_url : (data.videoUrl !== undefined ? data.videoUrl : recipe.video_url),
            prep_time_minutes: data.prep_time_minutes !== undefined ? parseInt(data.prep_time_minutes) : (data.prepTimeMinutes !== undefined ? parseInt(data.prepTimeMinutes) : recipe.prep_time_minutes),
            cook_time_minutes: data.cook_time_minutes !== undefined ? parseInt(data.cook_time_minutes) : (data.cookTimeMinutes !== undefined ? parseInt(data.cookTimeMinutes) : recipe.cook_time_minutes),
            servings: data.servings !== undefined ? parseInt(data.servings) : recipe.servings,
            calories: data.calories !== undefined ? parseInt(data.calories) : recipe.calories,
            difficulty: data.difficulty || recipe.difficulty,
            status: data.status || recipe.status
        };

        await recipeRepository.update(id, recipeData);

        if (data.ingredients) {
            const ingredients = typeof data.ingredients === 'string' ? JSON.parse(data.ingredients) : data.ingredients;
            const formattedIng = ingredients.map(ing => {
                if (typeof ing === 'string') return { name: ing };
                return ing;
            });
            await recipeRepository.saveIngredients(id, formattedIng);
        }

        if (data.steps) {
            const steps = typeof data.steps === 'string' ? JSON.parse(data.steps) : data.steps;
            await recipeRepository.saveSteps(id, steps);
        }

        if (data.images) {
            const images = typeof data.images === 'string' ? JSON.parse(data.images) : data.images;
            await recipeRepository.saveImages(id, images);
        }

        if (data.categoryIds || data.categories) {
            const categories = data.categoryIds || data.categories;
            const categoryIds = typeof categories === 'string' ? JSON.parse(categories) : categories;
            await recipeRepository.linkCategories(id, categoryIds);
        }

        return await this.getRecipeById(id);
    }

    async deleteRecipe(id, authorId, userRole) {
        const recipe = await recipeRepository.findById(id);
        if (!recipe) {
            const error = new Error('Không tìm thấy công thức nấu ăn');
            error.statusCode = 404;
            throw error;
        }

        if (recipe.author_id !== authorId && userRole !== 'admin') {
            const error = new Error('Bạn không có quyền xóa công thức này');
            error.statusCode = 403;
            throw error;
        }

        await recipeRepository.delete(id);
    }

    async getRecipesRanking() {
        return await recipeRepository.getRecipesRanking();
    }
}

module.exports = new RecipeService();
