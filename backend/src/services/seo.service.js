const SITE_URL = 'https://bepnhaminh.page';
const xml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
function sitemap(catalog) {
    const entries = ['/', '/search', '/community', '/chefs'].map(path => ({ path }));
    for (const recipe of catalog.recipes) entries.push({ path: `/recipe/${recipe.id}`, modified: recipe.updated_at });
    for (const category of catalog.categories) entries.push({ path: `/category/${encodeURIComponent(category.slug)}`, modified: category.updated_at });
    for (const post of catalog.posts) entries.push({ path: `/community/posts/${post.id}`, modified: post.updated_at });
    if (entries.length > 50000) throw new Error('Sitemap vượt 50.000 URL; cần chia sitemap index.');
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + entries.map(item => {
        const time = item.modified && new Date(item.modified);
        return `<url><loc>${xml(SITE_URL + item.path)}</loc>${time && Number.isFinite(time.getTime()) ? `<lastmod>${time.toISOString()}</lastmod>` : ''}</url>`;
    }).join('') + '</urlset>';
}
async function catalog(pool) {
    const [[recipes], [categories], [posts]] = await Promise.all([
        pool.query("SELECT id, updated_at FROM recipes WHERE status = 'published' ORDER BY id"),
        pool.query('SELECT id, name, slug, description, image_url, updated_at FROM categories WHERE slug IS NOT NULL AND slug <> \'\' ORDER BY id'),
        pool.query("SELECT p.id, p.updated_at FROM community_posts p JOIN users u ON u.id = p.author_id WHERE p.status = 'published' AND p.deleted_at IS NULL AND NOT (LEFT(u.username,15) = 'community_demo_' AND u.email LIKE 'community.%@example.invalid') ORDER BY p.id"),
    ]);
    return { recipes, categories, posts };
}
module.exports = { catalog, sitemap };
