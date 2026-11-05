const {createHash} = require('node:crypto');
const REVISION = '126caa3a8b58708a09b2b2e119ff4923b6f06d82';
const DATASET_URL = 'https://github.com/QuocAn55/A-New-Dataset-and-Empirical-Evaluation-for-Vietnamese-Food-Recommendation-System';
const SOURCES = [
    {key:'mnmn',file:'raw-mnmn.csv',remote:'Data/Raw Dataset/food_dataset_mnmnweb.csv',site:'https://monngonmoingay.com',hash:'75385deaba86f13161128691c39674476f058fd3f49d048ea4f192d14fb594cf'},
    {key:'cooky',file:'raw-cooky.csv',remote:'Data/Raw Dataset/food_dataset_cookyweb.csv',site:'https://www.cooky.vn',hash:'893303411b1c2337d312fc518a8f70632891fe1b6bb02d6ca50480446be687f6'},
];
const AUTHORS = ['hoanganh','chefquang','cheflan'];
const hash = text => createHash('sha256').update(text).digest('hex');
const clean = value => String(value ?? '').normalize('NFC').replace(/\u00a0/g,' ').trim();
const titleKey = value => clean(value).toLocaleLowerCase('vi').replace(/\s+/g,' ');
const slug = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

function parseCsv(text){
    const rows=[];let row=[],field='',quoted=false,closed=false;
    text=text.replace(/^\uFEFF/,'');
    for(let i=0;i<text.length;i++){
        const c=text[i];
        if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;continue;}
        if(c==='"'){if(field||closed)throw Error('CSV: dấu ngoặc kép sai vị trí');quoted=true;}
        else if(c===','){row.push(field);field='';closed=false;}
        else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(v=>v!==''))rows.push(row);row=[];field='';closed=false;}
        else{if(closed&&!/\s/.test(c))throw Error('CSV: ký tự sau dấu ngoặc kép');if(!closed)field+=c;}
    }
    if(quoted)throw Error('CSV: chuỗi chưa đóng');
    if(field||row.length){row.push(field);rows.push(row);}
    const headers=rows.shift();if(!headers||new Set(headers).size!==headers.length)throw Error('CSV: header không hợp lệ');
    return rows.map((values,index)=>{if(values.length!==headers.length)throw Error(`CSV: số cột sai ở dòng ${index+2}`);return Object.fromEntries(headers.map((key,i)=>[key,values[i]]));});
}
function imageUrl(value){
    try{const url=new URL(clean(value));if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.href.length>255)return null;return url.href;}catch{return null;}
}
function splitIngredients(text){
    const parts=[];let depth=0,part='';
    const source=clean(text);
    for(let index=0;index<source.length;index++){const c=source[index];if(c==='(')depth++;if(c===')')depth=Math.max(0,depth-1);const decimal=c===','&&/\d/.test(source[index-1]||'')&&/\d/.test(source[index+1]||'');if((c===','||c==='\n'||c===';')&&!depth&&!decimal){if(part.trim())parts.push(part.trim());part='';}else part+=c;}
    if(part.trim())parts.push(part.trim());return parts;
}
function ingredient(text){
    let name=clean(text),quantity=null,unit=null;
    const number='(?:\\d+(?:[.,]\\d+)?(?:\\s+\\d+/\\d+)?|\\d+/\\d+|[½¼¾])';
    const units='kg|kilogram|gr|gam|g|mg|ml|lít|lit|l|muỗng canh|muỗng cà phê|thìa canh|thìa cà phê|chén|bát|cốc|quả|trái|củ|con|cây|nhánh|lá|bó|gói|hộp|lát|miếng|viên|cái|ít|M|m';
    const colon=name.indexOf(':');
    const rx=new RegExp(`^\\s*(${number})\\s*(${units})(?=\\s|$|[,.()])`,'iu');
    if(colon>=0){const right=name.slice(colon+1).trim(),match=rx.exec(right);if(match){quantity=match[1];unit=match[2];name=name.slice(0,colon).trim().replace(new RegExp(`\\s+${number}\\s*(?:con|quả|trái|cây|củ)$`,'iu'),'');}else name=name.replace(':',' ');}
    else{
        const match=new RegExp(`^(.*?)\\s+(${number})\\s*(${units})(?=\\s|$|[,.()])(.*)$`,'iu').exec(name);
        if(match&&match[1]){name=match[1].trim();quantity=match[2];unit=match[3];}
    }
    // Preserve ambiguous ingredient text; never invent a quantity.
    if(!name||name.length>150||quantity?.length>50||unit?.length>50)throw Error('Nguyên liệu vượt giới hạn schema');
    return {name,quantity,unit,raw:clean(text)};
}
function quotas(total){
    const weights=[42,29,29],result=weights.map(w=>Math.floor(total*w/100));
    const remaining=total-result.reduce((a,b)=>a+b,0);
    const order=weights.map((w,i)=>({i,remainder:total*w%100})).sort((a,b)=>b.remainder-a.remainder||a.i-b.i);
    for(let i=0;i<remaining;i++)result[order[i].i]++;
    return result;
}
function distribute(records){
    const ordered=[...records].sort((a,b)=>hash(a.key).localeCompare(hash(b.key))),target=quotas(records.length),used=[0,0,0];
    return ordered.map((record,index)=>{const options=target.map((count,i)=>({i,score:count*(index+1)/records.length-used[i]})).filter(x=>used[x.i]<target[x.i]).sort((a,b)=>b.score-a.score||a.i-b.i);const i=options[0].i;used[i]++;return {...record,author:AUTHORS[i]};});
}
function convert(row,source){
    const title=clean(row['Tên món']),image=imageUrl(row['Link Ảnh']);
    if(!image)return {reason:'missing_image_url'};
    if(!title||title.length>150||!clean(row['Cách làm'])||!clean(row['Nguyên liệu']))return {reason:'missing_required_content'};
    if(!/^\d+$/.test(row.STT))return {reason:'invalid_source_id'};
    try{
        const ingredients=splitIngredients(row['Nguyên liệu']).map(ingredient);if(!ingredients.length)return {reason:'missing_required_content'};
        const steps=[];
        for(const [field,label] of [['Sơ chế','Sơ chế'],['Cách làm','Chế biến'],['Cách dùng','Cách dùng']]){
            const text=clean(row[field]);if(text)steps.push({instruction:`${label}\n${text}`,step_number:steps.length+1});
        }
        const servings=/^(\d+)\s+người$/.exec(clean(row['Khẩu phần']));
        const servingCount=servings&&Number(servings[1])>0?Number(servings[1]):null;
        const time=/^\d+$/.test(clean(row['Time Cooking']))?Number(row['Time Cooking']):null;
        const key=source.key+':'+row.STT;
        return {key,title,titleKey:titleKey(title),titleHash:hash(titleKey(title)),slug:`vfr-${source.key}-${row.STT}-${slug(title)}`.slice(0,150),description:clean(row['Giới thiệu'])||null,image,servings:servingCount,cookTime:time,ingredients,steps,
            category:clean(row['Loại món'])||'Công thức tham khảo',source:source.key,recordId:row.STT,sourceHash:hash(JSON.stringify(row)),metadata:{dataset:'ViFoodRec',datasetUrl:DATASET_URL,revision:REVISION,upstreamSite:source.site,sourceFile:source.remote,originalImageUrl:image,rawIngredients:row['Nguyên liệu'],rawServings:row['Khẩu phần'],rawCookingTime:row['Time Cooking'],tips:clean(row['Mách nhỏ']),nutritionBasis:'unknown',rawNutrition:Object.fromEntries(['Calories','Fat Amount','Fiber Amount','Sugar Amount','Protein Amount'].map(k=>[k,clean(row[k])])),warnings:['Nguồn không cung cấp riêng thời gian chuẩn bị và độ khó.','Chưa xác minh cơ sở/đơn vị số liệu dinh dưỡng.'],...(!servingCount?{servingsUnknown:true}:{})}};
    }catch(error){return {reason:'invalid_ingredient',detail:error.message};}
}
function prepare(inputs){
    const records=[],skipped=[],seen=new Map();
    for(const {source,rows} of inputs)for(const row of rows){const result=convert(row,source);if(result.reason){skipped.push({key:source.key+':'+row.STT,reason:result.reason,detail:result.detail});continue;}if(seen.has(result.titleKey)){skipped.push({key:result.key,reason:'duplicate_title',duplicateOf:seen.get(result.titleKey)});continue;}seen.set(result.titleKey,result.key);records.push(result);}
    return {records,skipped};
}
module.exports={REVISION,DATASET_URL,SOURCES,AUTHORS,hash,titleKey,parseCsv,imageUrl,ingredient,splitIngredients,quotas,distribute,prepare,convert};
