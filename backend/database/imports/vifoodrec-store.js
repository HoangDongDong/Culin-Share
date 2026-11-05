const {randomUUID}=require('node:crypto');
const {REVISION,AUTHORS,titleKey,distribute,quotas,hash}=require('./vifoodrec');
const snapshotHash=(fields,ingredients,steps)=>hash(JSON.stringify([fields,ingredients,steps]));

async function importRecipes(connection,prepared,{apply=false,status='draft',imageResults={},batchSize=50,log=()=>{}}={}){
    if(!['draft','published','verified'].includes(status))throw Error('Trạng thái nhập không hợp lệ');
    if(status==='verified'&&!Object.keys(imageResults).length)throw Error('Thiếu báo cáo kiểm tra ảnh');
    const [users]=await connection.query('SELECT id,username FROM users WHERE username IN (?,?,?)',AUTHORS);
    const authors=new Map(users.map(u=>[u.username,u.id]));
    for(const name of AUTHORS)if(!authors.has(name))throw Error('Không tìm thấy tài khoản '+name);
    const [originals]=await connection.query('SELECT r.title FROM recipes r LEFT JOIN recipe_imports i ON i.recipe_id=r.id WHERE i.recipe_id IS NULL');
    const existingTitles=new Set(originals.map(row=>titleKey(row.title)));
    const skipped=[...prepared.skipped];
    const eligible=prepared.records.filter(row=>{if(!existingTitles.has(row.titleKey))return true;skipped.push({key:row.key,reason:'existing_title'});return false;});
    const plan=distribute(eligible);
    const [imports]=await connection.query("SELECT source_key,source_hash,recipe_id FROM recipe_imports WHERE dataset='vifoodrec'");
    const done=new Map(imports.map(row=>[row.source_key,row]));
    const remaining=plan.filter(row=>{
        const previous=done.get(row.key);if(!previous)return true;
        if(previous.source_hash!==row.sourceHash)throw Error('Nguồn đã đổi nội dung: '+row.key+'; không tự ghi đè.');
        return false;
    });
    const summary={raw:prepared.records.length+prepared.skipped.length,eligible:plan.length,plannedAuthors:Object.fromEntries(AUTHORS.map((name,i)=>[name,quotas(plan.length)[i]])),alreadyImported:plan.length-remaining.length,toInsert:remaining.length,inserted:0,skipped:skipped.reduce((counts,row)=>(counts[row.reason]=(counts[row.reason]||0)+1,counts),{}),status};
    if(!apply)return {summary,skipped,plan};
    const batchId='vfr-'+REVISION.slice(0,12)+'-'+randomUUID();
    summary.batchId=batchId;
    await connection.query('INSERT INTO recipe_import_batches(id,dataset,revision,status,summary) VALUES (?,?,?,?,?)',[batchId,'vifoodrec',REVISION,'running',JSON.stringify(summary)]);
    try{
        let categoryId;
        const [categories]=await connection.query("SELECT id FROM categories WHERE slug='vifoodrec'");
        if(categories[0])categoryId=categories[0].id;
        else{const [result]=await connection.query('INSERT INTO categories(name,slug,description) VALUES (?,?,?)',['Công thức ViFoodRec','vifoodrec','Công thức tham khảo từ bộ dữ liệu ViFoodRec; nguồn nội dung được ghi trên từng bài.']);categoryId=result.insertId;}
        for(let start=0;start<remaining.length;start+=batchSize){
            const batch=remaining.slice(start,start+batchSize);await connection.beginTransaction();
            try{
                const recipeValues=batch.map(row=>[authors.get(row.author),row.title,row.slug,row.description,row.image,null,row.cookTime,row.servings,null,null,status==='verified'?(imageResults[row.image]?.ok?'published':'draft'):status]);
                await connection.query('INSERT INTO recipes(author_id,title,slug,description,cover_image_url,prep_time_minutes,cook_time_minutes,servings,calories,difficulty,status) VALUES ?',[recipeValues]);
                const [inserted]=await connection.query('SELECT id,slug FROM recipes WHERE slug IN (?)',[batch.map(row=>row.slug)]);
                const ids=new Map(inserted.map(row=>[row.slug,row.id]));
                const ingredientValues=[],stepValues=[],imageValues=[],categoryValues=[],importValues=[];
                for(const row of batch){
                    const recipeId=ids.get(row.slug);if(!recipeId)throw Error('Không xác định được ID sau bulk insert');
                    ingredientValues.push(...row.ingredients.map(i=>[recipeId,i.name,i.quantity,i.unit]));
                    stepValues.push(...row.steps.map(s=>[recipeId,s.step_number,s.instruction,0]));
                    imageValues.push([recipeId,row.image]);categoryValues.push([recipeId,categoryId]);
                    const fields=recipeValues[batch.indexOf(row)];
                    const snapshot=snapshotHash(fields,row.ingredients.map(i=>[i.name,i.quantity,i.unit]),row.steps.map(s=>[s.step_number,s.instruction,0]));
                    const metadata={...row.metadata,snapshotHash:snapshot,rawDishType:row.category,uploadedBy:row.author,sourceRecordId:row.recordId,ingredientParsing:'heuristic; raw source retained',imageVerification:imageResults[row.image]?.ok?'verified-image-response':'url-valid; availability requires separate check'};
                    importValues.push(['vifoodrec',row.key,row.titleHash,row.sourceHash,REVISION,recipeId,batchId,JSON.stringify(metadata)]);
                }
                await connection.query('INSERT INTO recipe_ingredients(recipe_id,name,quantity,unit) VALUES ?',[ingredientValues]);
                await connection.query('INSERT INTO recipe_steps(recipe_id,step_number,instruction,timer_seconds) VALUES ?',[stepValues]);
                await connection.query('INSERT INTO recipe_images(recipe_id,image_url) VALUES ?',[imageValues]);
                await connection.query('INSERT INTO recipe_categories(recipe_id,category_id) VALUES ?',[categoryValues]);
                await connection.query('INSERT INTO recipe_imports(dataset,source_key,title_hash,source_hash,revision,recipe_id,batch_id,metadata) VALUES ?',[importValues]);
                await connection.commit();summary.inserted+=batch.length;
            }catch(error){await connection.rollback();throw error;}
            await connection.query('UPDATE recipe_import_batches SET summary=? WHERE id=?',[JSON.stringify(summary),batchId]);log(`Đã nhập ${summary.inserted}/${remaining.length}`);
        }
        await connection.query("UPDATE recipe_import_batches SET status='complete',summary=? WHERE id=?",[JSON.stringify(summary),batchId]);
        return {summary,skipped,plan};
    }catch(error){await connection.query("UPDATE recipe_import_batches SET status='failed',summary=? WHERE id=?",[JSON.stringify({...summary,error:error.code||'IMPORT_FAILED'}),batchId]);throw error;}
}
async function lockedImport(connection,prepared,options){
    const [[db]]=await connection.query('SELECT DATABASE() AS name');
    const key='vfr:'+hash(db.name).slice(0,40);const [[lock]]=await connection.query('SELECT GET_LOCK(?,10) AS acquired',[key]);
    if(Number(lock.acquired)!==1)throw Error('Một tiến trình nhập khác đang chạy');
    try{return await importRecipes(connection,prepared,options);}finally{await connection.query('SELECT RELEASE_LOCK(?)',[key]);}
}
async function rollbackBatch(connection,batchId){
    await connection.beginTransaction();
    try{
        const [recipes]=await connection.query('SELECT r.*,i.metadata FROM recipes r JOIN recipe_imports i ON i.recipe_id=r.id WHERE i.batch_id=? FOR UPDATE',[batchId]);
        const [rows]=await connection.query(`SELECT r.id FROM recipes r JOIN recipe_imports i ON i.recipe_id=r.id WHERE i.batch_id=? AND (r.updated_at>i.created_at OR EXISTS(SELECT 1 FROM comments c WHERE c.recipe_id=r.id) OR EXISTS(SELECT 1 FROM reviews v WHERE v.recipe_id=r.id) OR EXISTS(SELECT 1 FROM saved_recipes s WHERE s.recipe_id=r.id) OR EXISTS(SELECT 1 FROM community_post_recipes p WHERE p.recipe_id=r.id)) FOR UPDATE`,[batchId]);
        if(rows.length)throw Error('Batch có nội dung đã sửa hoặc tương tác mới; không tự xóa');
        for(const row of recipes){
            const metadata=typeof row.metadata==='string'?JSON.parse(row.metadata):row.metadata;
            const [ingredients]=await connection.query('SELECT name,quantity,unit FROM recipe_ingredients WHERE recipe_id=? ORDER BY id',[row.id]);
            const [steps]=await connection.query('SELECT step_number,instruction,timer_seconds FROM recipe_steps WHERE recipe_id=? ORDER BY step_number',[row.id]);
            const fields=['author_id','title','slug','description','cover_image_url','prep_time_minutes','cook_time_minutes','servings','calories','difficulty','status'].map(key=>row[key]);
            if(!metadata.snapshotHash||snapshotHash(fields,ingredients.map(i=>[i.name,i.quantity,i.unit]),steps.map(s=>[s.step_number,s.instruction,s.timer_seconds]))!==metadata.snapshotHash)throw Error('Nội dung batch đã thay đổi hoặc không có snapshot an toàn; không tự xóa');
        }
        if(recipes.length)await connection.query('DELETE FROM recipes WHERE id IN (?)',[recipes.map(row=>row.id)]);
        await connection.query("UPDATE recipe_import_batches SET status='failed',summary=? WHERE id=?",[JSON.stringify({rolledBack:true,deleted:recipes.length}),batchId]);
        await connection.commit();return {rolledBack:true,deleted:recipes.length};
    }catch(error){await connection.rollback();throw error;}
}
module.exports={importRecipes,lockedImport,rollbackBatch};
