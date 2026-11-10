module.exports = {
    async up(connection) {
        // 1. Thêm cột collection_name vào bảng saved_recipes
        const [[savedCol]] = await connection.query(
            "SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'saved_recipes' AND column_name = 'collection_name'"
        );
        if (!savedCol.n) {
            await connection.query(
                "ALTER TABLE saved_recipes ADD COLUMN collection_name VARCHAR(50) NOT NULL DEFAULT 'want_to_try'"
            );
        }

        // Tạo index cho (user_id, collection_name)
        const [[savedIdx]] = await connection.query(
            "SELECT COUNT(*) AS n FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'saved_recipes' AND index_name = 'idx_saved_recipes_collection'"
        );
        if (!savedIdx.n) {
            await connection.query(
                "CREATE INDEX idx_saved_recipes_collection ON saved_recipes (user_id, collection_name)"
            );
        }

        // 2. Thêm cột image_url và tip vào bảng reviews (ảnh thành phẩm Cooksnap)
        const [[revCol]] = await connection.query(
            "SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'reviews' AND column_name = 'image_url'"
        );
        if (!revCol.n) {
            await connection.query(
                "ALTER TABLE reviews ADD COLUMN image_url VARCHAR(500) NULL"
            );
        }

        const [[tipCol]] = await connection.query(
            "SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'reviews' AND column_name = 'tip'"
        );
        if (!tipCol.n) {
            await connection.query(
                "ALTER TABLE reviews ADD COLUMN tip VARCHAR(255) NULL"
            );
        }
    }
};
