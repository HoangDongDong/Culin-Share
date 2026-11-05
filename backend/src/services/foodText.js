// Version 1: remove product branding while retaining culinary types and amounts.
const AJI_NGON = 'aji[\\s-]*ngon';
const AJI_MAYO = 'aji[\\s-]*mayo';
const AJI_MOTO = 'aji[\\s-]+no[\\s-]*mo[\\s-]*to';
const brandPattern = '(?:aji[\\s-]*(?:ngon|mayo|quick)|' + AJI_MOTO + '|ajinomoto|knorr|maggi|chin[\\s-]*su|chinsu|nam\\s+ngư|phú\\s+sĩ|blendy|lisa|kewpie|heinz|meizan|simply|vinamilk|nest[ée]a|nestl[ée]|oreo|miwon)';
const brandRegex = () => new RegExp('(?<![\\p{L}\\p{N}])'+brandPattern+'(?![\\p{L}\\p{N}])','giu');
const decoration = '[®™“”"\'‘’]*';
const replace = (text, pattern, value) => text.replace(new RegExp(pattern,'giu'),value);

function cleanFoodText(value) {
    if (typeof value !== 'string' || !value) return value;
    const input = value.normalize('NFC');
    if (!brandRegex().test(input) && !/[®™]/.test(input)) return value;
    let text = input;
    text = replace(text, 'bột\\s+gia\\s+vị\\s+đa\\s+năng(?:\\s+cao\\s+cấp)?\\s*'+decoration+AJI_MOTO+decoration+'(?:\\s+up)?'+decoration, 'bột gia vị đa năng');
    text = replace(text, '(?:hạt\\s+nêm(?:\\s+chay)?\\s*)'+AJI_NGON+decoration+'(?:\\s+(?:(?:từ\\s+)?nấm\\s+hương\\s+và\\s+hạt\\s+sen|\\(?\\s*(?:heo|gà|nấm)\\)?))?', 'hạt nêm');
    text = replace(text, 'hạt\\s+nêm(?:\\s+chay)?\\s+(?:knorr|maggi)'+decoration+'(?:\\s+(?:nấm\\s+hương(?:\\s+[12]\\s+hạt)?|heo|gà))?', 'hạt nêm');
    text = replace(text, '(?:bột\\s+ngọt\\s*)?(?:'+AJI_MOTO+')'+decoration, 'bột ngọt');
    text = replace(text, 'bột\\s+ngọt\\s+ajinomoto'+decoration, 'bột ngọt');
    text = replace(text, '(?:(?:xốt|sốt)\\s+)?mayon(?:n)?aise\\s+'+AJI_MAYO+decoration+'(?:\\s+vị\\s+(?:nguyên\\s+bản|ngọt\\s+dịu))?(?:\\s+nắp\\s+kép\\s+mới)?', 'xốt mayonnaise');
    text = replace(text, AJI_MAYO+decoration+'(?:\\s+vị\\s+(?:nguyên\\s+bản|ngọt\\s+dịu))?', 'xốt mayonnaise');
    text = replace(text, AJI_NGON+decoration, 'hạt nêm');
    text = replace(text, '(?:nước\\s+mắm\\s+)?nam\\s+ngư'+decoration, 'nước mắm');
    text = replace(text, '(?<![\\p{L}\\p{N}])(?:của\\s+)?'+decoration+brandPattern+decoration+'(?![\\p{L}\\p{N}])', match => /oreo/iu.test(match) ? 'bánh quy cacao kẹp kem' : ' ');
    text = text.replace(/[®™]/g,'').replace(/\(\s*tên cũ[^)]*\)/giu,'');
    text = text.replace(/gia vị nêm sẵn\s+(?=bột)/giu,'').replace(/gia vị nêm sẵn\s+(?=lẩu|phở|bún|thịt|cá)/giu,'gia vị ');
    text = text.replace(/trà sữa\s+royal/giu,'trà sữa').replace(/\broyal\s+trà sữa/giu,'trà sữa');
    text = text.replace(/bánh\s+bánh quy cacao kẹp kem/giu,'bánh quy cacao kẹp kem').replace(/(bột chiên giòn)\s*\(đỏ\)/giu,'$1');
    text = text.replace(/(?:xốt|sốt)\s+(?:xốt|sốt)\s+mayonnaise/giu,'xốt mayonnaise');
    text = text.replace(/(nước tương)\s+(hạt nêm)/giu,'$1, $2');
    text = text.replace(/\(\s*\)/g,'').replace(/[“”"‘’]\s*[“”"‘’]/g,'');
    return text.replace(/[ \t]+/g,' ').replace(/ +([,.;:!?])/g,'$1').replace(/ +\n/g,'\n').replace(/\n +/g,'\n').trim();
}

function cleanRecipeContent(data) {
    if(!data || typeof data!=='object') return data;
    return {...data,
        ...(typeof data.title==='string'?{title:cleanFoodText(data.title)}:{}),
        ...(typeof data.name==='string'?{name:cleanFoodText(data.name)}:{}),
        ...(typeof data.description==='string'?{description:cleanFoodText(data.description)}:{}),
        ...(Array.isArray(data.ingredients)?{ingredients:data.ingredients.map(i=>typeof i==='string'?cleanFoodText(i):{...i,name:cleanFoodText(i.name)})}:{}),
        ...(Array.isArray(data.steps)?{steps:data.steps.map(s=>typeof s==='string'?cleanFoodText(s):{...s,instruction:cleanFoodText(s.instruction)})}:{}),
    };
}
module.exports={cleanFoodText,cleanRecipeContent,brandRegex};
