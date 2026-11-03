const fail = message => { throw Object.assign(new Error(message), {statusCode:400}); };
const scalar = (value, key) => { if(value===undefined||value==='')return undefined; if(typeof value!=='string')fail(`${key} không hợp lệ`);return value.trim(); };
function parseSearch(query) {
    const result = {};
    for(const key of ['q','category','difficulty','sort']) {
        const value=scalar(query[key],key); if(value!==undefined) result[key==='q'?'query':key]=value;
    }
    if((result.query||'').length>200)fail('Từ khóa tối đa 200 ký tự');
    if(result.category?.length>500)fail('Danh mục quá dài');
    if(result.category&&result.category!=='all'&&!result.category.split(',').some(value=>value.trim()))fail('Danh mục không hợp lệ');
    if(result.sort&&!['newest','rating'].includes(result.sort))fail('Kiểu sắp xếp không hợp lệ');
    if(result.difficulty&&!['all','dễ','trung bình','khó'].includes(result.difficulty))fail('Độ khó không hợp lệ');
    for(const [key,max,min] of [['page',100000,1],['limit',50,1],['author_id',2147483647,1],['minCalories',100000,0],['maxCalories',100000,0],['minTime',10080,0],['maxTime',10080,0]]) {
        const raw=scalar(query[key],key);if(raw===undefined)continue;
        if(!/^\d+$/.test(raw)||Number(raw)>max||Number(raw)<min)fail(`${key} không hợp lệ`);
        result[key]=Number(raw);
    }
    for(const [min,max] of [['minCalories','maxCalories'],['minTime','maxTime']])if(result[min]!==undefined&&result[max]!==undefined&&result[min]>result[max])fail('Giá trị tối thiểu phải nhỏ hơn hoặc bằng tối đa');
    return result;
}
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase().trim();
// ! is the explicit LIKE escape character; user wildcards remain literal.
const like = value => `%${normalize(value).replace(/[!%_]/g,'!$&')}%`;
const searchable = column => `REPLACE(LOWER(${column}), 'đ', 'd') COLLATE utf8mb4_unicode_ci LIKE ? ESCAPE '!'`;
module.exports={parseSearch,normalize,like,searchable};
