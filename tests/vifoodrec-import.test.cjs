const test=require('node:test'),assert=require('node:assert/strict');
const d=require('../backend/database/imports/vifoodrec');
const source=d.SOURCES[0];
const sample=(changes={})=>({STT:'1','Tên món':'Bánh thử','Link Ảnh':'https://example.com/banh.jpg','Nguyên liệu':'Bột mì: 150g, Trứng gà 2 quả','Cách làm':'Trộn nguyên liệu. Hấp chín.','Khẩu phần':'4 người','Time Cooking':'25',...changes});
test('CSV handles quoted commas, embedded newlines, BOM, escaped quotes and rejects malformed rows',()=>{
    assert.deepEqual(d.parseCsv('\ufeffa,b\r\n"món, ngon","nấu\n""thử"""\r\n'),[{a:'món, ngon',b:'nấu\n"thử"'}]);
    assert.throws(()=>d.parseCsv('a,b\n"open,b'));assert.throws(()=>d.parseCsv('a,b\nx'));
});
test('missing images and duplicates are excluded; source content and uncertain fields remain truthful',()=>{
    const result=d.prepare([{source,rows:[sample(),sample({STT:'2','Tên món':' BÁNH   THỬ '}),sample({STT:'3','Link Ảnh':'Image link not found'}),sample({STT:'4','Link Ảnh':'javascript:alert(1)'})]}]);
    assert.equal(result.records.length,1);assert.equal(result.skipped.filter(r=>r.reason==='missing_image_url').length,2);assert.equal(result.skipped.filter(r=>r.reason==='duplicate_title').length,1);
    const record=result.records[0];assert.equal(record.ingredients[0].name,'Bột mì');assert.equal(record.ingredients[0].quantity,'150');assert.equal(record.steps[0].instruction,'Chế biến\nTrộn nguyên liệu. Hấp chín.');assert.equal(record.metadata.nutritionBasis,'unknown');
    assert.equal(d.convert(sample({'Khẩu phần':'0 người'}),source).servings,null);
    assert.deepEqual(d.splitIngredients('Sữa 1,5 lít, Trứng 2 quả'),['Sữa 1,5 lít','Trứng 2 quả']);
});
test('author quotas sum exactly and assignments are reproducible and dispersed',()=>{
    for(const size of [0,1,2,3,100,5509]){const q=d.quotas(size);assert.equal(q.reduce((a,b)=>a+b,0),size);}
    assert.deepEqual(d.quotas(5509),[2314,1598,1597]);
    const rows=Array.from({length:100},(_,i)=>({key:'test:'+i}));const assigned=d.distribute(rows);
    assert.deepEqual(assigned,d.distribute(rows.reverse()));
    assert.deepEqual(d.AUTHORS.map(name=>assigned.filter(r=>r.author===name).length),[42,29,29]);
    assert.equal(new Set(assigned.slice(0,5).map(r=>r.author)).size,3);
});
