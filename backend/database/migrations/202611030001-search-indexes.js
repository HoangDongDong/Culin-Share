module.exports = { async up(connection) {
    const [[column]]=await connection.query("SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='recipes' AND column_name='total_time_minutes'");
    if(!column.n)await connection.query('ALTER TABLE recipes ADD COLUMN total_time_minutes INT GENERATED ALWAYS AS (COALESCE(prep_time_minutes,0)+COALESCE(cook_time_minutes,0)) STORED');
    const indexes=[['recipes','idx_recipe_status_created','status,created_at,id'],['recipes','idx_recipe_author_status','author_id,status,created_at'],['recipes','idx_recipe_status_calories','status,calories'],['recipes','idx_recipe_status_time','status,total_time_minutes'],['reviews','idx_review_recipe_rating','recipe_id,rating'],['saved_recipes','idx_saved_recipe_created','recipe_id,created_at']];
    for(const [table,name,columns] of indexes){
        const [[existing]]=await connection.query('SELECT COUNT(*) AS n FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name=? AND index_name=?',[table,name]);
        if(!existing.n)await connection.query(`CREATE INDEX ${name} ON ${table} (${columns})`);
    }
}};
