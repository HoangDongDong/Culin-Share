module.exports={async up(connection){
    await connection.query(`CREATE TABLE IF NOT EXISTS recipe_import_batches (
        id VARCHAR(100) PRIMARY KEY, dataset VARCHAR(50) NOT NULL, revision CHAR(40) NOT NULL,
        status ENUM('running','complete','failed') NOT NULL DEFAULT 'running', summary JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await connection.query(`CREATE TABLE IF NOT EXISTS recipe_imports (
        id INT AUTO_INCREMENT PRIMARY KEY, dataset VARCHAR(50) NOT NULL, source_key VARCHAR(100) NOT NULL,
        title_hash CHAR(64) NOT NULL, source_hash CHAR(64) NOT NULL, revision CHAR(40) NOT NULL,
        recipe_id INT NOT NULL, batch_id VARCHAR(100) NOT NULL, metadata JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_recipe_import_source(dataset,source_key), UNIQUE KEY uq_recipe_import_title(dataset,title_hash),
        UNIQUE KEY uq_recipe_import_recipe(recipe_id), INDEX idx_recipe_import_batch(batch_id),
        FOREIGN KEY(recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
        FOREIGN KEY(batch_id) REFERENCES recipe_import_batches(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}};
