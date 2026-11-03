const pool = require('../config/database');
const community = require('./community.repository');

class HomeRepository {
    async load(sort, viewerId = 0) {
        const order = { newest: 'r.created_at DESC, r.id DESC', favorite: 'save_count DESC, r.id DESC', rating: 'average_rating DESC, review_count DESC, r.id DESC' }[sort] || 'r.created_at DESC, r.id DESC';
        const recipeSelect = `SELECT r.id,r.title,r.author_id,r.cover_image_url,r.prep_time_minutes,r.cook_time_minutes,
            u.full_name AS author_name,u.avatar_url AS author_avatar,
            (SELECT COUNT(*) FROM saved_recipes s WHERE s.recipe_id=r.id) AS save_count,
            (SELECT COUNT(*) FROM saved_recipes s WHERE s.recipe_id=r.id AND s.created_at>=DATE_SUB(NOW(),INTERVAL 7 DAY)) AS weekly_saves,
            EXISTS(SELECT 1 FROM saved_recipes s WHERE s.recipe_id=r.id AND s.user_id=?) AS saved,
            (SELECT COALESCE(AVG(rating),0) FROM reviews v WHERE v.recipe_id=r.id) AS average_rating,
            (SELECT COUNT(*) FROM reviews v WHERE v.recipe_id=r.id) AS review_count,
            (SELECT c.name FROM categories c JOIN recipe_categories rc ON rc.category_id=c.id WHERE rc.recipe_id=r.id ORDER BY c.id LIMIT 1) AS category
            FROM recipes r JOIN users u ON u.id=r.author_id WHERE r.status='published'`;
        const results = await Promise.all([
            pool.query(`SELECT c.id,c.name,c.slug,COUNT(r.id) AS recipe_count,
                COALESCE(NULLIF(c.image_url,''),(SELECT r2.cover_image_url FROM recipes r2 JOIN recipe_categories rc2 ON rc2.recipe_id=r2.id
                 WHERE rc2.category_id=c.id AND r2.status='published' AND r2.cover_image_url IS NOT NULL AND r2.cover_image_url<>'' ORDER BY r2.created_at DESC,r2.id DESC LIMIT 1)) AS image
                FROM categories c LEFT JOIN recipe_categories rc ON rc.category_id=c.id
                LEFT JOIN recipes r ON r.id=rc.recipe_id AND r.status='published'
                GROUP BY c.id ORDER BY recipe_count DESC,c.id LIMIT 8`),
            pool.query(`${recipeSelect} ORDER BY ${order} LIMIT 4`,[viewerId]),
            pool.query(`SELECT u.id,u.full_name,u.avatar_url,
                (SELECT COUNT(*) FROM follows f WHERE f.following_id=u.id) AS followers_count,
                (SELECT COUNT(*) FROM recipes r WHERE r.author_id=u.id AND r.status='published') AS recipe_count,
                EXISTS(SELECT 1 FROM follows f WHERE f.following_id=u.id AND f.follower_id=?) AS followed
                FROM users u WHERE EXISTS(SELECT 1 FROM recipes r WHERE r.author_id=u.id AND r.status='published')
                ORDER BY followers_count DESC,recipe_count DESC,u.id LIMIT 3`,[viewerId]),
            community.feed({viewerId,tab:'latest',page:1,limit:3,excludeSeedDemo:true}),
            pool.query(`${recipeSelect} HAVING weekly_saves>0 ORDER BY weekly_saves DESC,r.id DESC LIMIT 3`,[viewerId]),
        ]);
        return { categories:results[0][0], recipes:results[1][0], chefs:results[2][0], posts:results[3].posts, trends:results[4][0] };
    }
}
module.exports = new HomeRepository();
