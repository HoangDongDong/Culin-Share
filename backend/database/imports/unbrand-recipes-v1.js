const {randomUUID} = require('node:crypto');
const {cleanFoodText} = require('../../src/services/foodText');

const FIELDS = [
    {table:'recipes',field:'title',recipe:'id'},
    {table:'recipes',field:'description',recipe:'id'},
    {table:'recipe_ingredients',field:'name',recipe:'recipe_id'},
    {table:'recipe_steps',field:'instruction',recipe:'recipe_id'},
];
async function ensureBackup(connection) {
    await connection.query(`CREATE TABLE IF NOT EXISTS recipe_text_backups (
        id BIGINT AUTO_INCREMENT PRIMARY KEY, batch_id VARCHAR(100) NOT NULL,
        recipe_id INT NOT NULL, source_table VARCHAR(40) NOT NULL, record_id INT NOT NULL,
        field_name VARCHAR(40) NOT NULL, original_text LONGTEXT NOT NULL, cleaned_text LONGTEXT NOT NULL,
        version INT NOT NULL DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_recipe_text_backup_recipe(recipe_id), INDEX idx_recipe_text_backup_batch(batch_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}
async function unbrand(connection, {apply=false}={}) {
    const updates=[];
    for(const spec of FIELDS){
        const [rows]=await connection.query(`SELECT id,${spec.recipe} AS recipe_id,${spec.field} AS value FROM ${spec.table}`);
        for(const row of rows){
            const cleaned=cleanFoodText(row.value);
            if(cleaned!==row.value){
                if(!cleaned?.trim())throw Error('Làm sạch tạo nội dung rỗng: '+spec.table+':'+row.id);
                updates.push({...spec,...row,cleaned});
            }
        }
    }
    const summary={changedFields:updates.length,recipes:new Set(updates.map(x=>x.recipe_id)).size,fields:{}};
    for(const u of updates){const k=u.table+'.'+u.field;summary.fields[k]=(summary.fields[k]||0)+1;}
    if(!apply||!updates.length)return {summary,updates};
    await ensureBackup(connection);
    const batchId='unbrand-v1-'+randomUUID();summary.batchId=batchId;
    await connection.beginTransaction();
    try{
        for(const spec of FIELDS){
            const matching=updates.filter(x=>x.table===spec.table&&x.field===spec.field);
            for(let start=0;start<matching.length;start+=100){
                const batch=matching.slice(start,start+100),ids=batch.map(x=>x.id);
                const [locked]=await connection.query(`SELECT id,${spec.field} AS value FROM ${spec.table} WHERE id IN (?) FOR UPDATE`,[ids]);
                const current=new Map(locked.map(x=>[x.id,x.value]));
                if(batch.some(x=>current.get(x.id)!==x.value))throw Error('Nội dung vừa được sửa; dừng để không ghi đè');
                await connection.query('INSERT INTO recipe_text_backups(batch_id,recipe_id,source_table,record_id,field_name,original_text,cleaned_text) VALUES ?', [batch.map(x=>[batchId,x.recipe_id,x.table,x.id,x.field,x.value,x.cleaned])]);
                const clauses=batch.map(()=> 'WHEN ? THEN ?').join(' ');
                await connection.query(`UPDATE ${spec.table} SET ${spec.field}=CASE id ${clauses} ELSE ${spec.field} END WHERE id IN (?)`,[...batch.flatMap(x=>[x.id,x.cleaned]),ids]);
            }
        }
        await connection.commit();
    }catch(error){await connection.rollback();throw error;}
    return {summary,updates};
}
module.exports={unbrand,ensureBackup};
