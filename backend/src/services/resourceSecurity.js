const recipes=require('../repositories/recipe.repository');
const invalid=message=>{throw Object.assign(new Error(message),{statusCode:400});};
function id(value){if(!/^[1-9]\d*$/.test(String(value))||Number(value)>2147483647)invalid('ID không hợp lệ');return Number(value);}
async function publishedRecipe(value){const recipe=await recipes.findById(id(value));if(!recipe||recipe.status!=='published')throw Object.assign(new Error('Không tìm thấy công thức công khai'),{statusCode:404});return recipe;}
function validateUrls(value,key=''){
    if(!value||typeof value!=='object')return;
    for(const [field,item] of Object.entries(value)){
        if(['steps','images'].includes(field)&&typeof item==='string'){
            let parsed;try{parsed=JSON.parse(item);}catch{invalid('Danh sách ảnh/bước nấu không hợp lệ');}
            validateUrls(parsed,field);continue;
        }
        if(typeof item==='object'){validateUrls(item,field);continue;}
        if(typeof item==='string'&&(/(?:url|Url)$/.test(field)||key==='images')){
            if(!item.trim())continue;
            try{const url=new URL(item);if(!['http:','https:'].includes(url.protocol)||url.username||url.password)invalid('URL chỉ được dùng http hoặc https');}
            catch{invalid('URL không hợp lệ; chỉ chấp nhận http hoặc https');}
        }
    }
}
module.exports={id,publishedRecipe,validateUrls};
