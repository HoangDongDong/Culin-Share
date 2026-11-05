// Content classification, independent of the dataset's provenance label.
const DEFINITIONS = [
    ['mon-trang-mieng', 'Món tráng miệng'], ['do-uong', 'Đồ uống'],
    ['mon-chay', 'Món chay'], ['mon-nuoc', 'Món nước'], ['hai-san', 'Hải sản'],
    ['mon-an-sang', 'Món ăn sáng'], ['cac-loai-banh', 'Các loại bánh'], ['mon-man', 'Món mặn'],
    ['goi-salad', 'Gỏi & Salad'], ['gia-vi-nuoc-sot', 'Gia vị & Nước sốt'],
];
const fold = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function classify({title, ingredients = [], rawDishType = ''}) {
    const t = fold(title);
    const choose = (slug, reason) => ({slug, reason, version: 1});
    if (/^(nuoc (mam|cham|sot|tuong|mau)|sot |xot |siro |si ro |tuong |dau giam)/.test(t)) return choose('gia-vi-nuoc-sot', 'sauce-title');
    if (/^(sua chua uong|matcha (ca phe|sua)|bo sua tuoi|nuoc (mat |detox |giai khat|uong |nhan nhuc|dau den|cu nang|thao moc|tac |sa chanh|atiso|nha dam)|sua hanh nhan)/.test(t)) return choose('do-uong', 'beverage-title');
    const sweet = /^(che|kem|sua chua|yogurt|yaourt|pudding|tiramisu|panna cotta|flan|thach|rau cau|mut|keo|cookie|cookies|brownie|cupcake|pancake|waffle|crepe|donut|doughnut|macaron|mochi|mousse|cheesecake|bong lan)( |$)/;
    const sweetCake = /^banh (flan|bong lan|quy|qui|ngot|kem|chuoi|khoai mi|da lon|bo |bo$|trung thu|tart|tiramisu|su kem|pudding|chiffon|chocolate|socola|brownie|cookie|donut|ran vi chanh|ran nhan ngot|deo|troi|chay|tet nhan chuoi|duc ngot|phu the|xu xe|pate so ngot)/;
    const savoryCake = /\b(man|thit|cha lua|cha bong|xuc xich|pate|lap xuong|tom|hanh mo)\b/.test(t);
    const extraSweetCake = /^banh (pancake|crepe|cupcake|cheesecake|mousse|muffin|dorayaki|gato|su |chocopie|biscotti|meringue|souffle|stollen|caramel|lava|luoi meo|tieu|cam |cam$|tai yen|thuan|kep tan ong|ba lai|gan$|chin tang may|tro$|la gai|la dua|dau xanh|dau do|dau tay|tao|xoai|sau rieng|dua |dua$|sua|trung kfc|khoai lang|tam khoai mi|ran|quay duong|it nhan dua|it tran.*nhan dua)/.test(t);
    if (sweet.test(t) || (!savoryCake && (sweetCake.test(t) || extraSweetCake || /^banh .*\b(ngot|socola|chocolate|matcha|cookies|kem tuoi|sinh nhat|sua chua|mut|rau cau)\b/.test(t))) || /^(trai cay|da bao|tau hu (nuoc duong|deo)|chocolate .*cake|chocolate truffle|matcha cakepop)/.test(t)) return choose('mon-trang-mieng', 'sweet-dish-title');
    if (/^(sinh to|nuoc ep|nuoc chanh|nuoc cam|nuoc mia|nuoc sam|nuoc rau ma|nuoc dua|tra |tra$|ca phe|cafe|coffee|latte|cappuccino|smoothie|soda|cocktail|mocktail|detox|sua dau|sua hat|sua bap|sua ngo|sua gao|sua tuoi|sua bi do|sua chua uong|chocolate nong|cacao|ca cao)/.test(t)) return choose('do-uong', 'beverage-title');
    // Keep accents here: cà is not cá, bơ is not bò.
    const animal = /(?:^|[^\p{L}])(thịt|gà|vịt|heo|lợn|bò|tôm|cua|mực|cá|nghêu|ngao|sò|ốc|lươn|ếch|nước mắm|mắm tôm|chả cá|giò sống)(?=$|[^\p{L}])/iu;
    const ingredientText = ingredients.map(i => typeof i === 'string' ? i : i.name).join(' ').normalize('NFC');
    if (/\bchay\b/.test(t) || (fold(rawDishType) === 'mon chay' && !animal.test(String(title).normalize('NFC') + ' ' + ingredientText))) return choose('mon-chay', 'vegetarian-title-or-source');
    if (/^(goi |salad )/.test(t)) return choose('goi-salad', 'salad-title');
    const dryNoodles = /\b(xao|tron|cuon|chien|ap chao|sot|xot|kho|nuong)\b/;
    if (/^(canh |lau |sup |soup |chao )/.test(t) || (/^(banh canh |pho |bun |hu tieu |mien |mi quang|mi ramen|ramen)/.test(t) && !dryNoodles.test(t))) return choose('mon-nuoc', 'soup-or-broth-noodles-title');
    if (/\b(tom|cua|ghe|muc|bach tuoc|ngheu|ngao|so diep|so huyet|so long|hau|ca hoi|ca thu|ca ngu|ca trich|ca mu|ca chem|hai san)\b/.test(t)) return choose('hai-san', 'seafood-title');
    if (/^(xoi |banh m[iy]( |$)|banh cuon|banh uot|banh gio|banh bao|trung op la|omelet|omelette|ngu coc|granola|oatmeal)/.test(t)) return choose('mon-an-sang', 'breakfast-title');
    if (/^banh /.test(t)) return choose('cac-loai-banh', 'cake-title');
    return choose('mon-man', 'savory-default');
}

async function ensureCategories(connection) {
    const [existing] = await connection.query('SELECT id,slug FROM categories');
    const ids = new Map(existing.map(c => [c.slug, c.id]));
    for (const [slug, name] of DEFINITIONS) {
        if (ids.has(slug)) continue;
        const [result] = await connection.query('INSERT INTO categories(name,slug,description) VALUES (?,?,?)', [name, slug, `Khám phá công thức ${name.toLocaleLowerCase('vi')} và hướng dẫn chế biến.`]);
        ids.set(slug, result.insertId);
    }
    return ids;
}

async function reclassify(connection, {apply = false} = {}) {
    const [tables] = await connection.query("SHOW TABLES LIKE 'recipe_imports'");
    if (!tables.length) return {total: 0, changed: 0, groups: {}, records: []};
    const [rows] = await connection.query("SELECT r.id,r.title,r.status,i.metadata,c.id AS category_id,c.slug FROM recipe_imports i JOIN recipes r ON r.id=i.recipe_id LEFT JOIN recipe_categories rc ON rc.recipe_id=r.id LEFT JOIN categories c ON c.id=rc.category_id WHERE i.dataset='vifoodrec' ORDER BY r.id,c.id");
    const [ingredients] = await connection.query("SELECT ing.recipe_id,ing.name FROM recipe_ingredients ing JOIN recipe_imports i ON i.recipe_id=ing.recipe_id WHERE i.dataset='vifoodrec'");
    const byRecipe = new Map();
    for (const i of ingredients) { if (!byRecipe.has(i.recipe_id)) byRecipe.set(i.recipe_id, []); byRecipe.get(i.recipe_id).push(i); }
    const grouped = new Map();
    for (const row of rows) {
        if (!grouped.has(row.id)) grouped.set(row.id, {...row, categories: []});
        if (row.slug) grouped.get(row.id).categories.push({id: row.category_id, slug: row.slug});
    }
    const report = {total: grouped.size, changed: 0, groups: {}, records: []};
    const updates = [];
    for (const row of grouped.values()) {
        // Keep categories selected by an editor; replace the import placeholder only.
        if (row.categories.length && !row.categories.some(c => c.slug === 'vifoodrec')) continue;
        const meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
        const result = classify({title: row.title, ingredients: byRecipe.get(row.id), rawDishType: meta.rawDishType});
        report.groups[result.slug] = (report.groups[result.slug] || 0) + 1;
        report.records.push({id: row.id, title: row.title, status: row.status, ...result});
        updates.push({row, meta, result});
    }
    report.changed = updates.length;
    if (!apply || !updates.length) return report;
    await connection.beginTransaction();
    try {
        const ids = await ensureCategories(connection);
        for (let start = 0; start < updates.length; start += 100) {
            const batch = updates.slice(start, start + 100);
            await connection.query('INSERT IGNORE INTO recipe_categories(recipe_id,category_id) VALUES ?', [batch.map(x => [x.row.id, ids.get(x.result.slug)])]);
            await connection.query("DELETE rc FROM recipe_categories rc JOIN categories c ON c.id=rc.category_id WHERE c.slug='vifoodrec' AND rc.recipe_id IN (?)", [batch.map(x => x.row.id)]);
        }
        // Provenance stays in recipe_imports; it is not a food category.
        await connection.query("DELETE c FROM categories c LEFT JOIN recipe_categories rc ON rc.category_id=c.id WHERE c.slug='vifoodrec' AND rc.recipe_id IS NULL");
        await connection.commit();
    } catch (error) { await connection.rollback(); throw error; }
    return report;
}
module.exports = {DEFINITIONS, classify, ensureCategories, reclassify};
