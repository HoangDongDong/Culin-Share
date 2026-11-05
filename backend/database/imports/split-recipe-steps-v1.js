const {randomUUID}=require('node:crypto');
const {splitSteps,hasSourceHeading}=require('../../src/services/recipeStepSplitter');
const signature=rows=>JSON.stringify(rows.map(s=>[s.id,s.recipe_id,s.step_number,s.instruction,s.image_url||null,Number(s.timer_seconds)||0]));
const payload=rows=>JSON.stringify(rows.map(s=>[s.step_number,s.instruction,s.image_url||null,Number(s.timer_seconds)||0]));
async function ensureJournal(c){
    await c.query(`CREATE TABLE IF NOT EXISTS recipe_step_splits (
        recipe_id INT PRIMARY KEY, version INT NOT NULL DEFAULT 1, batch_id VARCHAR(100) NOT NULL,
        original_steps JSON NOT NULL, split_steps JSON NOT NULL, source_spans JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, restored_at TIMESTAMP NULL DEFAULT NULL,
        INDEX idx_step_split_batch(batch_id), FOREIGN KEY(recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}
async function splitImportedSteps(c,{apply=false,log=()=>{}}={}){
    const [tables]=await c.query("SHOW TABLES LIKE 'recipe_imports'");
    if(!Array.isArray(tables)||!tables.length)return {summary:{recipes:0,changed:0},records:[]};
    const [journal]=await c.query("SHOW TABLES LIKE 'recipe_step_splits'");
    const done=new Set(journal.length?(await c.query('SELECT recipe_id FROM recipe_step_splits'))[0].map(r=>r.recipe_id):[]);
    const [rows]=await c.query("SELECT s.*,r.title FROM recipe_steps s JOIN recipe_imports i ON i.recipe_id=s.recipe_id JOIN recipes r ON r.id=s.recipe_id WHERE i.dataset='vifoodrec' ORDER BY s.recipe_id,s.step_number,s.id");
    const grouped=new Map();for(const {title,...row} of rows){if(!grouped.has(row.recipe_id))grouped.set(row.recipe_id,{id:row.recipe_id,title,steps:[]});grouped.get(row.recipe_id).steps.push(row);}
    const summary={recipes:grouped.size,alreadyProcessed:0,protected:0,unchanged:0,changed:0,beforeSteps:0,afterSteps:0,distribution:{}};
    const plan=[];
    for(const recipe of grouped.values()){
        if(done.has(recipe.id)){summary.alreadyProcessed++;continue;}
        if(recipe.steps.some(s=>s.image_url||Number(s.timer_seconds)>0||!hasSourceHeading(s.instruction))){summary.protected++;continue;}
        const split=splitSteps(recipe.steps);
        if(split.steps.length<=recipe.steps.length){summary.unchanged++;continue;}
        plan.push({...recipe,split});summary.changed++;summary.beforeSteps+=recipe.steps.length;summary.afterSteps+=split.steps.length;
        summary.distribution[split.steps.length]=(summary.distribution[split.steps.length]||0)+1;
    }
    const report={summary,records:plan.map(r=>({id:r.id,title:r.title,before:r.steps.length,after:r.split.steps.length})),examples:plan.filter((r,i)=>i<3||r.title==='Bánh canh cua'||r.title==='Rau củ kho chay').map(r=>({id:r.id,title:r.title,before:r.steps,after:r.split.steps}))};
    if(!apply||!plan.length)return report;
    await ensureJournal(c);const batchId='steps-v1-'+randomUUID();summary.batchId=batchId;
    for(let start=0;start<plan.length;start+=50){
        const batch=plan.slice(start,start+50),ids=batch.map(r=>r.id);await c.beginTransaction();
        try{
            const [current]=await c.query('SELECT * FROM recipe_steps WHERE recipe_id IN (?) ORDER BY recipe_id,step_number,id FOR UPDATE',[ids]);
            for(const r of batch)if(signature(current.filter(s=>s.recipe_id===r.id))!==signature(r.steps))throw Error('Bước nấu vừa được sửa; dừng để không ghi đè');
            await c.query('INSERT INTO recipe_step_splits(recipe_id,version,batch_id,original_steps,split_steps,source_spans) VALUES ?',[batch.map(r=>[r.id,1,batchId,JSON.stringify(r.steps),JSON.stringify(r.split.steps),JSON.stringify(r.split.spans)])]);
            await c.query('DELETE FROM recipe_steps WHERE recipe_id IN (?)',[ids]);
            await c.query('INSERT INTO recipe_steps(recipe_id,step_number,instruction,image_url,timer_seconds) VALUES ?',[batch.flatMap(r=>r.split.steps.map(s=>[r.id,s.step_number,s.instruction,null,0]))]);
            await c.commit();
        }catch(error){await c.rollback();throw error;}
        log(`Đã tách ${Math.min(start+50,plan.length)}/${plan.length} món`);
    }
    return report;
}
const json=value=>typeof value==='string'?JSON.parse(value):value;
async function restoreBatch(c,batchId){
    await c.beginTransaction();try{
        const [rows]=await c.query('SELECT * FROM recipe_step_splits WHERE batch_id=? AND restored_at IS NULL FOR UPDATE',[batchId]);
        for(const row of rows){
            const [current]=await c.query('SELECT * FROM recipe_steps WHERE recipe_id=? ORDER BY step_number,id FOR UPDATE',[row.recipe_id]);
            if(payload(current)!==payload(json(row.split_steps)))throw Error('Bước mới đã được sửa hoặc thêm ảnh/timer; không tự khôi phục');
        }
        for(const row of rows){
            await c.query('DELETE FROM recipe_steps WHERE recipe_id=?',[row.recipe_id]);
            await c.query('INSERT INTO recipe_steps(id,recipe_id,step_number,instruction,image_url,timer_seconds) VALUES ?',[json(row.original_steps).map(s=>[s.id,s.recipe_id,s.step_number,s.instruction,s.image_url, s.timer_seconds])]);
        }
        if(rows.length)await c.query('UPDATE recipe_step_splits SET restored_at=CURRENT_TIMESTAMP WHERE recipe_id IN (?)',[rows.map(r=>r.recipe_id)]);
        await c.commit();return {restored:rows.length};
    }catch(error){await c.rollback();throw error;}
}
module.exports={splitImportedSteps,ensureJournal,restoreBatch};
