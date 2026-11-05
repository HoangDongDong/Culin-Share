const test=require('node:test'),assert=require('node:assert/strict');
const {splitInstruction,splitSteps}=require('../backend/src/services/recipeStepSplitter');
test('split source operations while retaining exact source spans, numbers and ordering',()=>{
    const text='Sơ chế\n– Rửa sạch thịt. Cắt thịt thành miếng 2cm.\n– Ướp thịt với 1,5M nước mắm, 1/2m tiêu, để thấm 10 - 15 phút.\n– Trộn bột với 1.2 lít nước.';
    const result=splitInstruction(text);
    assert.ok(result.pieces.length>=3);assert.equal(result.pieces.map(x=>x.raw).join(''),result.body);
    const rendered=result.pieces.map(x=>x.instruction).join('\n');
    for(const value of ['2cm','1,5M','1/2m','10 - 15 phút','1.2 lít'])assert.ok(rendered.includes(value));
    assert.ok(result.pieces.some(x=>x.instruction.includes('Ướp thịt')&&x.instruction.includes('để thấm 10 - 15 phút')));
    assert.ok(splitInstruction('Chế biến\nƯớp với 1M muối, để thấm 10 – 15 phút.').pieces[0].instruction.includes('10 – 15 phút'));
    assert.ok(splitInstruction('Chế biến\nPhi hành rồi nêm 1.5M hạt nêm, 1M nước tương, 1/2m bột ngọt, thêm 2 chén nước kho đến khi mềm.').pieces.some(p=>p.instruction.includes('1.5M')));
});
test('keep ingredients, conditions, heat and doneness with the operation; do not fabricate steps',()=>{
    const text='Chế biến\nĐun 200ml nước với muối, đường, tiêu đến khi sôi ở lửa nhỏ trong 5 phút. Nếu nước cạn thì thêm nước. Khi thịt chín mềm thì tắt bếp. Cho thịt ra đĩa.';
    const {pieces}=splitInstruction(text);assert.equal(pieces.length,2);
    assert.ok(pieces[0].instruction.includes('Nếu nước cạn'));assert.ok(pieces[0].instruction.includes('Khi thịt chín mềm'));
    assert.equal(splitInstruction('Chế biến\nDùng nóng.').pieces.length,1);
    assert.equal(splitInstruction('Sơ chế\nCà rốt tỉa hoa, cắt lát. Thơm cắt miếng vừa ăn.').pieces.length,2);
    assert.equal(splitInstruction('Chế biến\nCho rau vào chảo. Trộn đều.').pieces.length,1);
});
test('preserve source stage order, attach headers, and use sequential variable step counts',()=>{
    const source=[{id:7,step_number:1,instruction:'Sơ chế\n– Rửa rau.\n– Cắt thịt.'},{id:8,step_number:2,instruction:'Chế biến\nXốt chấm: – Trộn 2M nước mắm với 1M đường. Đun sôi 3 phút.'}];
    const r=splitSteps(source);assert.equal(r.steps.length,4);assert.deepEqual(r.steps.map(s=>s.step_number),[1,2,3,4]);
    assert.ok(r.steps[2].instruction.includes('Xốt chấm:'));assert.ok(r.steps[2].instruction.includes('Trộn 2M'));
    for(const s of r.spans){const original=source.find(x=>x.id===s.sourceStepId);assert.ok(original.instruction.slice(s.sourceStart,s.sourceEnd).trim());}
});
test('rollback refuses to overwrite a newly edited step or attached image',async()=>{
    const {restoreBatch}=require('../backend/database/imports/split-recipe-steps-v1');let rolled=false,deleted=false;
    const c={async beginTransaction(){},async commit(){},async rollback(){rolled=true;},async query(sql){
        if(sql.startsWith('SELECT * FROM recipe_step_splits'))return [[{recipe_id:4,split_steps:[{step_number:1,instruction:'Đun nước.',image_url:null,timer_seconds:0}]}]];
        if(sql.startsWith('SELECT * FROM recipe_steps'))return [[{step_number:1,instruction:'Đun nước.',image_url:'/new-photo.jpg',timer_seconds:0}]];
        if(sql.startsWith('DELETE'))deleted=true;return [[]];
    }};
    await assert.rejects(restoreBatch(c,'fixture'),/đã được sửa/);assert.equal(rolled,true);assert.equal(deleted,false);
});
