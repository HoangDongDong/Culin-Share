module.exports = {
    async up(connection) {
        for (const [slug,name,icon,order] of [
            ['vietnamese','Món Việt','ramen_dining',1], ['vegetarian','Món chay','eco',2],
            ['tips','Mẹo nhà bếp','lightbulb',3], ['healthy','Healthy','favorite',4], ['baking','Làm bánh','bakery_dining',5],
        ]) await connection.query('INSERT INTO community_topics(slug,name,icon,sort_order) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE slug=VALUES(slug)', [slug,name,icon,order]);
    },
};
