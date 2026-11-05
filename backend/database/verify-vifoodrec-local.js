// Integration fixture: fixed loopback host and a separate named database, never backend/.env.
const mysql=require('mysql2/promise');
const {randomBytes}=require('node:crypto');
const fs=require('node:fs/promises');
const path=require('node:path');
const assert=require('node:assert/strict');
const {runMigrations}=require('./runner');
const {load}=require('./import-vifoodrec');
const {lockedImport,rollbackBatch}=require('./imports/vifoodrec-store');
const {AUTHORS,hash,titleKey}=require('./imports/vifoodrec');
const DATABASE='culinshare_vifoodrec_test_final';
async function main(){
    const password=process.env.IMPORT_DB_PASSWORD;if(password===undefined)throw Error('Thiếu IMPORT_DB_PASSWORD cho MySQL local');
    const c=await mysql.createConnection({host:'127.0.0.1',port:3306,user:'root',password,multipleStatements:false});
    const previousEnv={NODE_ENV:process.env.NODE_ENV,COMMUNITY_SEED_DEMO:process.env.COMMUNITY_SEED_DEMO};
    process.env.NODE_ENV='production';process.env.COMMUNITY_SEED_DEMO='false';
    try{
        await c.query('CREATE DATABASE IF NOT EXISTS culinshare_vifoodrec_test_final CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');await c.changeUser({database:DATABASE});
        await runMigrations({connection:c,seed:false,log:()=>{}});
        const [users]=await c.query('SELECT id,username,full_name,avatar_url FROM culinshare.users WHERE username IN (?,?,?) OR id IN (SELECT author_id FROM culinshare.recipes)',AUTHORS);
        const bcrypt=require('bcryptjs');const passwordHash=await bcrypt.hash(randomBytes(32).toString('hex'),10);
        for(const user of users)await c.query('INSERT IGNORE INTO users(id,username,password_hash,email,full_name,avatar_url,is_verified) VALUES (?,?,?,?,?,?,1)',[user.id,user.username,passwordHash,`local-vfr-${user.id}@example.invalid`,user.full_name,user.avatar_url]);
        for(const table of ['categories','recipes','recipe_categories','recipe_ingredients','recipe_steps','recipe_images']){
            const [columns]=await c.query('SHOW COLUMNS FROM culinshare.'+c.escapeId(table));
            const names=columns.filter(col=>!col.Extra.includes('GENERATED')).map(col=>c.escapeId(col.Field)).join(',');
            await c.query(`INSERT IGNORE INTO ${c.escapeId(table)} (${names}) SELECT ${names} FROM culinshare.${c.escapeId(table)}`);
        }
        const [[before]]=await c.query('SELECT COUNT(*) AS n FROM recipes WHERE id NOT IN (SELECT recipe_id FROM recipe_imports)');
        const prepared=await load(path.join(__dirname,'../.cache/vifoodrec'));
        const imageResults=JSON.parse(await fs.readFile(path.join(__dirname,'../.cache/vifoodrec/image-check.json'),'utf8')).results;
        const policy={status:'verified',imageResults};
        const dry=await lockedImport(c,prepared,{apply:false,...policy});
        const [[prior]]=await c.query('SELECT COUNT(*) AS n FROM recipe_imports');
        if(!prior.n){
            // Simulate a transaction failure, then a committed checkpoint interruption.
            const realQuery=c.query.bind(c);let steps=0;
            c.query=async(sql,params)=>{if(sql.startsWith('INSERT INTO recipe_steps')&&++steps===1)throw Error('simulated transaction failure');return realQuery(sql,params);};
            await assert.rejects(lockedImport(c,prepared,{apply:true,...policy,batchSize:2}),/simulated/);
            c.query=realQuery;
            const [[rolledBack]]=await c.query('SELECT COUNT(*) AS n FROM recipe_imports');assert.equal(rolledBack.n,0);
            await assert.rejects(lockedImport(c,prepared,{apply:true,...policy,batchSize:50,log:()=>{throw Error('simulated checkpoint interruption');}}),/simulated/);
            const [[checkpoint]]=await c.query('SELECT COUNT(*) AS n FROM recipe_imports');assert.equal(checkpoint.n,50);
        }
        const result=await lockedImport(c,prepared,{apply:true,...policy,log:console.log});
        const repeat=await lockedImport(c,prepared,{apply:true,...policy});assert.equal(repeat.summary.inserted,0);
        const [authorCounts]=await c.query("SELECT u.username,COUNT(*) AS n FROM recipe_imports i JOIN recipes r ON r.id=i.recipe_id JOIN users u ON u.id=r.author_id WHERE i.dataset='vifoodrec' GROUP BY u.username");
        for(const {username,n} of authorCounts)assert.equal(n,result.summary.plannedAuthors[username]);
        const [[total]]=await c.query('SELECT COUNT(*) AS n FROM recipe_imports');assert.equal(total.n,result.summary.eligible);
        const [[after]]=await c.query('SELECT COUNT(*) AS n FROM recipes WHERE id NOT IN (SELECT recipe_id FROM recipe_imports)');assert.equal(after.n,before.n);
        const [[invalid]]=await c.query(`SELECT COUNT(*) AS n FROM recipe_imports i JOIN recipes r ON r.id=i.recipe_id WHERE r.cover_image_url IS NULL OR NOT EXISTS(SELECT 1 FROM recipe_ingredients g WHERE g.recipe_id=r.id) OR NOT EXISTS(SELECT 1 FROM recipe_steps s WHERE s.recipe_id=r.id) OR NOT EXISTS(SELECT 1 FROM recipe_categories m WHERE m.recipe_id=r.id)`);assert.equal(invalid.n,0);
        const [[duplicates]]=await c.query('SELECT COUNT(*) AS n FROM (SELECT title_hash FROM recipe_imports GROUP BY title_hash HAVING COUNT(*)>1) d');assert.equal(duplicates.n,0);
        const suffix=randomBytes(8).toString('hex'),testTitle='Local rollback fixture '+suffix;
        const fixture={...prepared.records[0],key:'local-test:'+suffix,title:testTitle,titleKey:titleKey(testTitle),titleHash:hash(titleKey(testTitle)),slug:'vfr-local-fixture-'+suffix,sourceHash:hash(suffix)};
        const insertedFixture=await lockedImport(c,{records:[fixture],skipped:[]},{apply:true,status:'draft'});
        const [[fixtureRow]]=await c.query('SELECT r.id,r.updated_at FROM recipes r JOIN recipe_imports i ON i.recipe_id=r.id WHERE i.batch_id=?',[insertedFixture.summary.batchId]);
        await c.query('UPDATE recipes SET title=? WHERE id=?',[testTitle+' edited',fixtureRow.id]);
        await assert.rejects(rollbackBatch(c,insertedFixture.summary.batchId),/đã sửa|đã thay đổi/);
        await c.query('UPDATE recipes SET title=?,updated_at=? WHERE id=?',[testTitle,fixtureRow.updated_at,fixtureRow.id]);
        const rolled=await rollbackBatch(c,insertedFixture.summary.batchId);assert.equal(rolled.deleted,1);
        const [[afterRollback]]=await c.query('SELECT COUNT(*) AS n FROM recipe_imports');assert.equal(afterRollback.n,total.n);
        const [publication]=await c.query('SELECT r.status,COUNT(*) AS n FROM recipe_imports i JOIN recipes r ON r.id=i.recipe_id GROUP BY r.status');
        const report={database:DATABASE,baselineRecipes:before.n,summary:result.summary,authorCounts,publication,idempotent:true,transactionRollback:true,checkpointResume:true,batchRollback:true,editedRecipeProtected:true};
        await fs.writeFile(path.join(__dirname,'../.cache/vifoodrec/local-verification.json'),JSON.stringify(report,null,2));
        const envText=`PORT=3002\nDB_HOST=127.0.0.1\nDB_PORT=3306\nDB_USER=root\nDB_PASSWORD=${password}\nDB_NAME=${DATABASE}\nDB_SSL=false\nJWT_SECRET=${randomBytes(32).toString('hex')}\nCOMMUNITY_SEED_DEMO=false\nCORS_ORIGIN=http://localhost:5052,http://127.0.0.1:5052\n`;
        await fs.writeFile(path.join(__dirname,'../.cache/vifoodrec/local-test.env'),envText,{mode:0o600});
        console.log(JSON.stringify(report,null,2));
    }finally{for(const [key,value] of Object.entries(previousEnv)){if(value===undefined)delete process.env[key];else process.env[key]=value;}await c.end();}
}
main().catch(error=>{console.error('Local verification failed:',error.code||error.message);process.exitCode=1;});
