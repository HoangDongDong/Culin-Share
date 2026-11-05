const test=require('node:test'),assert=require('node:assert/strict');
const {cleanFoodText:clean,cleanRecipeContent}=require('../backend/src/services/foodText');
test('remove brands and product variants, preserving food types, amounts and Vietnamese',()=>{
    const cases={
        'Hạt nêm Aji-ngon® Heo':'hạt nêm',
        'Gà xốt Aji-mayo®':'Gà xốt mayonnaise',
        'Hạt nêm Aji-ngon® Nấm':'hạt nêm',
        'Hạt nêm Aji-ngon® (Gà)':'hạt nêm',
        'Bột ngọt AJI-NO-MOTO®':'bột ngọt',
        'Bột ngọt AJI-NO-MO-TO®':'bột ngọt',
        'Nước tương “Phú Sĩ”':'Nước tương',
        'Giấm gạo lên men của Ajinomoto':'Giấm gạo lên men',
        'Xốt Mayonnaise Aji-mayo® Vị Nguyên Bản':'xốt mayonnaise',
        'Gia vị nêm sẵn Aji-Quick® Lẩu Thái':'gia vị Lẩu Thái',
        'Gia vị nêm sẵn Aji-Quick® Bột tẩm khô chiên giòn':'Bột tẩm khô chiên giòn',
        'Trà sữa Royal "Blendy"':'trà sữa',
        'Bột gia vị đa năng cao cấp "AJI-NO-MOTO® UP"':'bột gia vị đa năng',
        'Bánh Oreo 28 cặp':'bánh quy cacao kẹp kem 28 cặp',
        '1 chai mắm nêm hoặc nam ngư':'1 chai mắm nêm hoặc nước mắm',
        'Hạt nêm chay Knorr Nấm hương 2 Hạt':'hạt nêm',
        '1,5M hạt nêm Aji-ngon® Heo, 200g thịt heo và 2M dầu mè.':'1,5M hạt nêm, 200g thịt heo và 2M dầu mè.',
    };
    for(const [from,to] of Object.entries(cases)){assert.equal(clean(from),to,from);assert.equal(clean(clean(from)),to,from+' idempotent');}
    for(const text of ['Nước mắm','Muối tôm','Tiêu xanh','Dầu mè','Nấm hương','Thịt heo','1,5 lít nước','Nước cốt dừa\nĐun 5 phút.'])assert.equal(clean(text),text);
    assert.equal(clean(null),null);
});
test('shopping list sent to UI and PDF uses generic names and keeps special ingredients',()=>{
    const {shoppingPlan}=require('../backend/src/services/fridgeMatching.service');
    const r=shoppingPlan([{name:'Gà xốt Aji-mayo®',ingredients:[{name:'Xốt Mayonnaise Aji-mayo® Vị Nguyên Bản',quantity:100,unit:'g'},{name:'Hạt nêm Aji-ngon® Heo',quantity:1,unit:'g'},{name:'Dầu mè',quantity:2,unit:'ml'}],steps:['Thêm hạt nêm Aji-ngon® Heo.']}],[{name:'xốt mayonnaise',quantity:40,unit:'g'}]);
    assert.deepEqual(r.shoppingList,['60 g xốt mayonnaise','2 ml Dầu mè']);
    assert.equal(r.recipes[0].name,'Gà xốt mayonnaise');assert.equal(r.recipes[0].steps[0],'Thêm hạt nêm.');
    assert.equal(r.recipes[0].pantryIngredients[0].name,'hạt nêm');
});
test('clean recipe text without touching quantities, URLs, author IDs or structured fields',()=>{
    const r=cleanRecipeContent({name:'Gà xốt Aji-mayo®',author_id:2,cover_image_url:'https://example.com/ajinomoto.png',ingredients:[{name:'Hạt nêm Aji-ngon® Heo',quantity:'1,5',unit:'thìa'}],steps:['Cho bột ngọt AJI-NO-MOTO® vào.']});
    assert.equal(r.ingredients[0].quantity,'1,5');assert.equal(r.ingredients[0].name,'hạt nêm');assert.equal(r.author_id,2);assert.equal(r.cover_image_url,'https://example.com/ajinomoto.png');assert.equal(r.steps[0],'Cho bột ngọt vào.');
});
