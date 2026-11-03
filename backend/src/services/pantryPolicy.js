// Product policy for everyday pantry staples, not a synonym table for recipe retrieval.
// Match whole names so special ingredients (muối tôm, tiêu xanh, dầu mè...) remain on the shopping list.
const BASIC_PANTRY_LABELS = ['muối', 'đường', 'nước mắm', 'nước tương', 'hạt tiêu', 'dầu ăn', 'hạt nêm', 'bột ngọt', 'nước lọc'];
const basicNames = new Set([
    'muoi', 'muoi an', 'muoi tinh', 'muoi hat', 'muoi bien',
    'duong', 'duong trang', 'duong cat', 'duong cat trang',
    'nuoc mam', 'nuoc mam ngon', 'nuoc mam nguyen chat',
    'nuoc tuong', 'xi dau',
    'tieu', 'hat tieu', 'tieu den', 'hat tieu den', 'tieu xay', 'hat tieu xay', 'tieu den xay', 'tieu bot',
    'dau an', 'dau thuc vat', 'dau an thuc vat',
    'hat nem', 'bot ngot', 'mi chinh',
    'nuoc', 'nuoc loc', 'nuoc soi', 'nuoc am',
]);
function isBasicPantry(name) {
    const normalized = String(name || '').normalize('NFD').toLowerCase()
        .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
        .replace(/\((vua du|tuy khau vi|nem nem)\)/g, ' ')
        .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
        .replace(/^(?:thia canh|thia ca phe|muong canh|muong ca phe|canh|ca phe) /, '');
    return basicNames.has(normalized);
}
module.exports = { isBasicPantry, BASIC_PANTRY_LABELS };
