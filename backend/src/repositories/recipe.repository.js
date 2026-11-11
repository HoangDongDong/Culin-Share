const pool = require('../config/database');
const {like,searchable}=require('../services/searchFilters');
const {cleanFoodText}=require('../services/foodText');

class RecipeRepository {
    async findPublishedForMatching() {
        const [recipes] = await pool.query(`
            SELECT r.id, r.title, r.description, r.cover_image_url, r.servings,
                   r.prep_time_minutes, r.cook_time_minutes, r.difficulty,
                   u.full_name AS author_name
            FROM recipes r LEFT JOIN users u ON u.id = r.author_id
            WHERE r.status = 'published'
            ORDER BY r.id ASC
        `);
        const [ingredients] = await pool.query(`
            SELECT i.recipe_id, i.name, i.quantity, i.unit
            FROM recipe_ingredients i JOIN recipes r ON r.id = i.recipe_id
            WHERE r.status = 'published' ORDER BY i.id ASC
        `);
        const grouped = new Map();
        for (const ingredient of ingredients) {
            if (!grouped.has(ingredient.recipe_id)) grouped.set(ingredient.recipe_id, []);
            grouped.get(ingredient.recipe_id).push(ingredient);
        }
        return recipes.map(recipe => ({ ...recipe, ingredients: grouped.get(recipe.id) || [] }));
    }

    async findAll(filters = {}) {
        const selectSql = `
            SELECT r.*, u.full_name AS author_name, u.avatar_url AS author_avatar,
                   COALESCE(avg_rev.avg_rating, 0) AS average_rating,
                   COALESCE(avg_rev.rev_count, 0) AS review_count,
                   (SELECT GROUP_CONCAT(c.name ORDER BY c.name SEPARATOR ',')
                    FROM recipe_categories rc JOIN categories c ON rc.category_id = c.id
                    WHERE rc.recipe_id = r.id) AS category_list
            FROM recipes r
            LEFT JOIN users u ON r.author_id = u.id
            LEFT JOIN (
                SELECT recipe_id, AVG(rating) AS avg_rating, COUNT(*) AS rev_count
                FROM reviews
                GROUP BY recipe_id
            ) avg_rev ON r.id = avg_rev.recipe_id
        `;

        const whereClauses = [];
        const params = [];

        // 1. Search Query
        if (filters.query && filters.query.trim()) {
            whereClauses.push(`(${searchable('r.title')} OR ${searchable('r.description')} OR ${searchable('u.full_name')} OR EXISTS(SELECT 1 FROM recipe_ingredients i WHERE i.recipe_id=r.id AND ${searchable('i.name')}))`);
            const likeParam = like(filters.query);
            params.push(likeParam, likeParam, likeParam, likeParam);
        }

        // 2. Category Filter
        if (filters.category && filters.category !== 'all') {
            const categories=filters.category.split(',').map(value=>value.trim()).filter(Boolean).slice(0,20);
            const marks=categories.map(()=>'?').join(',');
            whereClauses.push(`EXISTS(SELECT 1 FROM recipe_categories fc JOIN categories cc ON cc.id=fc.category_id WHERE fc.recipe_id=r.id AND (cc.name IN (${marks}) OR cc.slug IN (${marks})))`);
            params.push(...categories,...categories);
        }

        // 3. Difficulty Filter
        if (filters.difficulty && filters.difficulty !== 'all') {
            let difficultyVal = filters.difficulty.toLowerCase();
            if (difficultyVal === 'vừa' || difficultyVal === 'trung bình') {
                difficultyVal = 'trung bình';
            } else if (difficultyVal === 'dễ') {
                difficultyVal = 'dễ';
            } else if (difficultyVal === 'khó') {
                difficultyVal = 'khó';
            }
            whereClauses.push('r.difficulty = ?');
            params.push(difficultyVal);
        }

        // 4. Author Filter
        if (filters.author_id) {
            whereClauses.push('r.author_id = ?');
            params.push(filters.author_id);
        }

        for(const [key,column,op] of [['minCalories','calories','>='],['maxCalories','calories','<='],['minTime','total_time_minutes','>='],['maxTime','total_time_minutes','<=']]) {
            if(filters[key]!==undefined){whereClauses.push(`r.${column} ${op} ?`);params.push(filters[key]);}
        }
        // 5. Status Filter
        if (filters.status) {
            whereClauses.push('r.status = ?');
            params.push(filters.status);
        } else if (!filters.includeAllStatus) {
            whereClauses.push("r.status = 'published'");
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        let orderSql = 'ORDER BY r.created_at DESC, r.id DESC';
        if (filters.sort === 'rating') {
            orderSql = 'ORDER BY average_rating DESC, review_count DESC, r.id DESC';
        } else if (filters.sort === 'newest') {
            orderSql = 'ORDER BY r.created_at DESC, r.id DESC';
        }

        // Pagination — mặc định 12 công thức/trang, tối đa 50
        const page  = Math.max(1, parseInt(filters.page)  || 1);
        const limit = Math.min(50, Math.max(1, parseInt(filters.limit) || 12));
        const offset = (page - 1) * limit;

        // Đếm tổng số kết quả (không LIMIT) để frontend tính số trang
        const countSql = `
            SELECT COUNT(DISTINCT r.id) AS total
            FROM recipes r
            LEFT JOIN users u ON r.author_id = u.id
            LEFT JOIN recipe_categories rc ON r.id = rc.recipe_id
            LEFT JOIN categories c ON rc.category_id = c.id
            ${whereSql}
        `;
        const [countRows] = await pool.query(countSql, params);
        const total = countRows[0]?.total || 0;

        const querySql = `
            ${selectSql}
            ${whereSql}
            ${orderSql}
            LIMIT ? OFFSET ?
        `;

        const [rows] = await pool.query(querySql, [...params, limit, offset]);
        const recipes = rows.map(row => {
            row.categories = row.category_list ? row.category_list.split(',') : [];
            delete row.category_list;
            return row;
        });

        return {
            data: recipes,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async suggestions(query) {
        if(query.trim().length<2)return [];
        const pattern=like(query);
        const [rows]=await pool.query(`SELECT label,kind FROM (
            SELECT r.title AS label,'recipe' AS kind,0 AS priority FROM recipes r WHERE r.status='published' AND ${searchable('r.title')}
            UNION ALL SELECT DISTINCT i.name AS label,'ingredient' AS kind,1 AS priority FROM recipe_ingredients i JOIN recipes r ON r.id=i.recipe_id WHERE r.status='published' AND ${searchable('i.name')}
        ) suggestions GROUP BY label,kind,priority ORDER BY priority,label LIMIT 8`,[pattern,pattern]);
        return rows;
    }

    async findById(id) {
        const sql = `
            SELECT r.*, u.full_name AS author_name, u.avatar_url AS author_avatar, u.bio AS author_bio,
                   COALESCE(avg_rev.avg_rating, 0) AS average_rating,
                   COALESCE(avg_rev.rev_count, 0) AS review_count
            FROM recipes r
            LEFT JOIN users u ON r.author_id = u.id
            LEFT JOIN (
                SELECT recipe_id, AVG(rating) AS avg_rating, COUNT(*) AS rev_count
                FROM reviews
                GROUP BY recipe_id
            ) avg_rev ON r.id = avg_rev.recipe_id
            WHERE r.id = ?
        `;
        const [rows] = await pool.query(sql, [id]);
        return rows[0] || null;
    }

    async findBySlug(slug) {
        const sql = `
            SELECT r.*, u.full_name AS author_name, u.avatar_url AS author_avatar, u.bio AS author_bio,
                   COALESCE(avg_rev.avg_rating, 0) AS average_rating,
                   COALESCE(avg_rev.rev_count, 0) AS review_count
            FROM recipes r
            LEFT JOIN users u ON r.author_id = u.id
            LEFT JOIN (
                SELECT recipe_id, AVG(rating) AS avg_rating, COUNT(*) AS rev_count
                FROM reviews
                GROUP BY recipe_id
            ) avg_rev ON r.id = avg_rev.recipe_id
            WHERE r.slug = ?
        `;
        const [rows] = await pool.query(sql, [slug]);
        return rows[0] || null;
    }

    async create(recipeData) {
        const {
            author_id, title, slug, description, cover_image_url, video_url,
            prep_time_minutes, cook_time_minutes, servings, calories, difficulty, status = 'published'
        } = recipeData;

        const [result] = await pool.query(
            `INSERT INTO recipes (author_id, title, slug, description, cover_image_url, video_url, 
                                  prep_time_minutes, cook_time_minutes, servings, calories, difficulty, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [author_id, title, slug, description || null, cover_image_url || null, video_url || null,
             prep_time_minutes || 0, cook_time_minutes || 0, servings || 0, calories || 0, difficulty || 'dễ', status]
        );
        return result.insertId;
    }

    async update(id, recipeData) {
        const {
            title, slug, description, cover_image_url, video_url,
            prep_time_minutes, cook_time_minutes, servings, calories, difficulty, status
        } = recipeData;

        await pool.query(
            `UPDATE recipes SET title = ?, slug = ?, description = ?, cover_image_url = ?, video_url = ?,
                                prep_time_minutes = ?, cook_time_minutes = ?, servings = ?, calories = ?, difficulty = ?, status = ?
             WHERE id = ?`,
            [title, slug, description || null, cover_image_url || null, video_url || null,
             prep_time_minutes || 0, cook_time_minutes || 0, servings || 0, calories || 0, difficulty || 'dễ', status || 'published', id]
        );
    }

    async delete(id) {
        await pool.query('DELETE FROM recipes WHERE id = ?', [id]);
    }

    // Helper functions for details
    async getImportInfo(recipeId) {
        try {
            const [rows]=await pool.query('SELECT metadata FROM recipe_imports WHERE recipe_id=?',[recipeId]);
            const value=rows[0]?.metadata;const metadata=typeof value==='string'?JSON.parse(value):value||null;
            return metadata?{...metadata,tips:cleanFoodText(metadata.tips)}:null;
        } catch(error) {if(error.code==='ER_NO_SUCH_TABLE')return null;throw error;}
    }

    async getIngredients(recipeId) {
        const [rows] = await pool.query('SELECT * FROM recipe_ingredients WHERE recipe_id = ? ORDER BY id ASC', [recipeId]);
        return rows;
    }

    async getSteps(recipeId) {
        const [rows] = await pool.query('SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_number ASC', [recipeId]);
        return rows;
    }

    async getImages(recipeId) {
        const [rows] = await pool.query('SELECT * FROM recipe_images WHERE recipe_id = ? ORDER BY id ASC', [recipeId]);
        return rows;
    }

    async getCategories(recipeId) {
        const [rows] = await pool.query(
            `SELECT c.* FROM categories c
             JOIN recipe_categories rc ON c.id = rc.category_id
             WHERE rc.recipe_id = ?`,
            [recipeId]
        );
        return rows;
    }

    // Saving details helpers
    async saveIngredients(recipeId, ingredients) {
        // Clear old ones
        await pool.query('DELETE FROM recipe_ingredients WHERE recipe_id = ?', [recipeId]);
        if (ingredients && ingredients.length > 0) {
            const values = ingredients.map(ing => [recipeId, cleanFoodText(ing.name), ing.quantity || null, ing.unit || null]);
            await pool.query('INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit) VALUES ?', [values]);
        }
    }

    async saveSteps(recipeId, steps) {
        // Clear old ones
        await pool.query('DELETE FROM recipe_steps WHERE recipe_id = ?', [recipeId]);
        if (steps && steps.length > 0) {
            const values = steps.map((step, idx) => [recipeId, step.step_number || (idx + 1), cleanFoodText(step.instruction), step.image_url || null, step.timer_seconds || 0]);
            await pool.query('INSERT INTO recipe_steps (recipe_id, step_number, instruction, image_url, timer_seconds) VALUES ?', [values]);
        }
    }

    async fillMissingStepTimers(recipeId, steps) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            for (const step of steps) {
                await connection.query(`UPDATE recipe_steps SET timer_seconds = ?
                    WHERE recipe_id = ? AND id = ? AND instruction = ?
                    AND (timer_seconds IS NULL OR timer_seconds <= 0)`,
                    [step.timer_seconds, recipeId, step.id, step.instruction]);
            }
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally { connection.release(); }
    }

    async saveImages(recipeId, images) {
        // Clear old ones
        await pool.query('DELETE FROM recipe_images WHERE recipe_id = ?', [recipeId]);
        if (images && images.length > 0) {
            const values = images.map(imgUrl => [recipeId, typeof imgUrl === 'string' ? imgUrl : imgUrl.image_url]);
            await pool.query('INSERT INTO recipe_images (recipe_id, image_url) VALUES ?', [values]);
        }
    }

    async linkCategories(recipeId, categoryIds) {
        // Clear old ones
        await pool.query('DELETE FROM recipe_categories WHERE recipe_id = ?', [recipeId]);
        if (categoryIds && categoryIds.length > 0) {
            const values = categoryIds.map(catId => [recipeId, catId]);
            await pool.query('INSERT INTO recipe_categories (recipe_id, category_id) VALUES ?', [values]);
        }
    }

    async getRecipesRanking() {
        const rankingSql = (orderBy) => `
            SELECT r.id, r.title, r.slug, r.cover_image_url, r.description,
                   r.prep_time_minutes, r.cook_time_minutes, r.difficulty,
                   u.full_name AS author_name,
                   (SELECT COUNT(*) FROM saved_recipes WHERE recipe_id = r.id) AS likes_count,
                   (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE recipe_id = r.id) AS avg_rating,
                   (SELECT COUNT(*) FROM reviews WHERE recipe_id = r.id) AS reviews_count
            FROM recipes r
            LEFT JOIN users u ON r.author_id = u.id
            WHERE r.status = 'published'
            ORDER BY ${orderBy}, r.created_at DESC, r.id DESC
            LIMIT 10
        `;
        const [[mostSaved], [highestRated], [mostReviewed]] = await Promise.all([
            pool.query(rankingSql('likes_count DESC')),
            pool.query(rankingSql('avg_rating DESC, reviews_count DESC, likes_count DESC')),
            pool.query(rankingSql('reviews_count DESC, avg_rating DESC, likes_count DESC')),
        ]);

        return { mostSaved, highestRated, mostReviewed };
    }
}

module.exports = new RecipeRepository();
