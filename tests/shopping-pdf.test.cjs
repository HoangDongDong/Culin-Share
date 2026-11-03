const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
test('shopping PDF embeds Vietnamese font, paginates and rejects empty shopping lists',async t=>{
    const font=await fs.readFile(path.join(__dirname,'../frontend/public/fonts/NotoSans-Regular.ttf'));
    t.mock.method(globalThis,'fetch',async()=>new Response(font));
    const {createShoppingPdf}=await import(pathToFileURL(path.join(__dirname,'../frontend/src/services/shoppingPdf.js')));
    await assert.rejects(createShoppingPdf({items:[]}));
    const pdf=await createShoppingPdf({items:['200 g Đậu hũ','1 bó Rau muống',...Array.from({length:130},(_,i)=>`Nguyên liệu ${i+1}: Kiểm tra định lượng nấm kim châm và thịt gà cho bữa ăn gia đình.`)],recipes:[{name:'Đậu hũ sốt cà chua'}],peopleCount:2,date:new Date('2026-11-03T00:00:00Z')});
    assert.ok(pdf.getNumberOfPages()>3);
    const output=pdf.output();assert.ok(output.startsWith('%PDF-'));assert.ok(output.includes('/ToUnicode'));assert.ok(output.includes('/FontFile2'));
    await fs.mkdir(path.join(__dirname,'../tmp/pdfs'),{recursive:true});
    await fs.writeFile(path.join(__dirname,'../tmp/pdfs/shopping-test.pdf'),Buffer.from(pdf.output('arraybuffer')));
});
