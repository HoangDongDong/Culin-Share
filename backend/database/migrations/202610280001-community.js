module.exports = {
    async up(connection) {
        const statements = [
            `CREATE TABLE IF NOT EXISTS community_posts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                author_id INT NOT NULL,
                content TEXT NOT NULL,
                status ENUM('draft','pending','published','hidden') NOT NULL DEFAULT 'published',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at DATETIME NULL,
                CONSTRAINT fk_community_posts_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_community_posts_feed (status, deleted_at, created_at, id),
                INDEX idx_community_posts_author (author_id, created_at, id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS community_post_media (
                id INT AUTO_INCREMENT PRIMARY KEY,
                post_id INT NOT NULL,
                media_url VARCHAR(2048) NOT NULL,
                public_id VARCHAR(255) NULL,
                media_type ENUM('image','video') NOT NULL DEFAULT 'image',
                sort_order INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_community_media_post FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
                UNIQUE KEY uq_community_media_order (post_id, sort_order)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS community_post_recipes (
                post_id INT NOT NULL,
                recipe_id INT NOT NULL,
                sort_order INT NOT NULL DEFAULT 0,
                PRIMARY KEY (post_id, recipe_id),
                INDEX idx_community_post_recipes_recipe (recipe_id, post_id),
                CONSTRAINT fk_community_post_recipes_post FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
                CONSTRAINT fk_community_post_recipes_recipe FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS community_post_likes (
                post_id INT NOT NULL,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (post_id, user_id),
                INDEX idx_community_post_likes_user (user_id, post_id),
                CONSTRAINT fk_community_likes_post FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
                CONSTRAINT fk_community_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS community_comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                post_id INT NOT NULL,
                user_id INT NOT NULL,
                parent_id INT NULL,
                content TEXT NOT NULL,
                status ENUM('published','hidden') NOT NULL DEFAULT 'published',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at DATETIME NULL,
                UNIQUE KEY uq_community_comment_post (post_id, id),
                INDEX idx_community_comments_thread (post_id, parent_id, created_at, id),
                INDEX idx_community_comments_user (user_id),
                CONSTRAINT fk_community_comments_post FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
                CONSTRAINT fk_community_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_community_comments_parent FOREIGN KEY (post_id, parent_id)
                    REFERENCES community_comments(post_id, id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS community_reports (
                id INT AUTO_INCREMENT PRIMARY KEY,
                reporter_id INT NOT NULL,
                post_id INT NULL,
                comment_id INT NULL,
                reason ENUM('spam','inappropriate','misinformation','harassment','other') NOT NULL,
                description TEXT NULL,
                status ENUM('pending','reviewed','dismissed') NOT NULL DEFAULT 'pending',
                reviewed_by INT NULL,
                reviewed_at DATETIME NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT chk_community_report_target CHECK ((post_id IS NOT NULL) + (comment_id IS NOT NULL) = 1),
                CONSTRAINT fk_community_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_community_report_post FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
                CONSTRAINT fk_community_report_comment FOREIGN KEY (comment_id) REFERENCES community_comments(id) ON DELETE CASCADE,
                CONSTRAINT fk_community_report_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
                UNIQUE KEY uq_community_report_post (reporter_id, post_id),
                UNIQUE KEY uq_community_report_comment (reporter_id, comment_id),
                INDEX idx_community_reports_queue (status, created_at, id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        ];
        for (const statement of statements) await connection.query(statement);

        // Guard each ALTER independently: MySQL DDL commits implicitly, so retries
        // must also work if an earlier attempt stopped between two ALTERs.
        for (const column of ['post_id', 'community_comment_id']) {
            const [rows] = await connection.query(`SELECT 1 FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = ?`, [column]);
            if (!rows.length) await connection.query(`ALTER TABLE notifications ADD COLUMN \`${column}\` INT NULL`);
        }
        const constraints = [
            ['fk_notifications_community_post', 'post_id', 'community_posts'],
            ['fk_notifications_community_comment', 'community_comment_id', 'community_comments'],
        ];
        for (const [name, column, table] of constraints) {
            const [rows] = await connection.query(`SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS
                WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND CONSTRAINT_NAME = ?`, [name]);
            if (!rows.length) await connection.query(`ALTER TABLE notifications ADD CONSTRAINT \`${name}\`
                FOREIGN KEY (\`${column}\`) REFERENCES \`${table}\`(id) ON DELETE SET NULL`);
        }
        const [[column]] = await connection.query(`SELECT COLUMN_TYPE AS type FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'type'`);
        if (column.type.startsWith('enum(')) {
            const current = [...column.type.matchAll(/'((?:[^']|'')*)'/g)].map(match => match[1].replace(/''/g, "'"));
            const desired = [...new Set([...current, 'new_recipe', 'community_like', 'community_comment', 'community_reply', 'community_new_post'])];
            if (desired.length !== current.length) await connection.query(`ALTER TABLE notifications MODIFY COLUMN type
                ENUM(${desired.map(value => connection.escape(value)).join(',')}) NOT NULL`);
        }
    },
};
