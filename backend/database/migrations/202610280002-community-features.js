module.exports = {
    async up(connection) {
        const definitions = [
            `CREATE TABLE IF NOT EXISTS community_topics (
                slug VARCHAR(32) PRIMARY KEY, name VARCHAR(100) NOT NULL, icon VARCHAR(32) NOT NULL DEFAULT 'restaurant', sort_order INT NOT NULL DEFAULT 0
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS community_saved_posts (
                post_id INT NOT NULL, user_id INT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY(post_id,user_id), INDEX idx_community_saved_user(user_id,post_id),
                FOREIGN KEY(post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS community_challenges (
                id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(150) NOT NULL, description TEXT NOT NULL,
                cover_image_url VARCHAR(2048) NULL, starts_at DATETIME NOT NULL, ends_at DATETIME NOT NULL,
                status ENUM('draft','published','closed') NOT NULL DEFAULT 'draft', created_by INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT chk_community_challenge_dates CHECK(ends_at > starts_at), INDEX idx_challenge_dates(status,ends_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS community_challenge_participants (
                challenge_id INT NOT NULL, user_id INT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY(challenge_id,user_id), FOREIGN KEY(challenge_id) REFERENCES community_challenges(id) ON DELETE CASCADE,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS community_events (
                id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(150) NOT NULL, description TEXT NOT NULL,
                starts_at DATETIME NOT NULL, ends_at DATETIME NOT NULL, location VARCHAR(255) NOT NULL,
                event_url VARCHAR(2048) NULL, status ENUM('draft','published','cancelled') NOT NULL DEFAULT 'draft',
                created_by INT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT chk_community_event_dates CHECK(ends_at > starts_at), INDEX idx_event_dates(status,ends_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS community_event_registrations (
                event_id INT NOT NULL, user_id INT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY(event_id,user_id), FOREIGN KEY(event_id) REFERENCES community_events(id) ON DELETE CASCADE,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        ];
        for (const sql of definitions) await connection.query(sql);
        for (const [name, definition] of [
            ['title', 'VARCHAR(150) NULL'], ['topic_slug', 'VARCHAR(32) NULL'],
            ['post_kind', "ENUM('story','tip','challenge') NOT NULL DEFAULT 'story'"], ['challenge_id', 'INT NULL'],
        ]) {
            const [rows] = await connection.query("SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='community_posts' AND COLUMN_NAME=?", [name]);
            if (!rows.length) await connection.query(`ALTER TABLE community_posts ADD COLUMN \`${name}\` ${definition}`);
        }
        for (const [name, column, table, target] of [
            ['fk_community_post_topic','topic_slug','community_topics','slug'],
            ['fk_community_post_challenge','challenge_id','community_challenges','id'],
        ]) {
            const [rows] = await connection.query("SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='community_posts' AND CONSTRAINT_NAME=?", [name]);
            if (!rows.length) await connection.query(`ALTER TABLE community_posts ADD CONSTRAINT \`${name}\` FOREIGN KEY(\`${column}\`) REFERENCES \`${table}\`(\`${target}\`) ON DELETE SET NULL`);
        }
        const [indexes] = await connection.query("SHOW INDEX FROM community_posts WHERE Key_name='idx_community_topic_kind'");
        if (!indexes.length) await connection.query('ALTER TABLE community_posts ADD INDEX idx_community_topic_kind(topic_slug,post_kind,status,deleted_at,id)');
    },
};
