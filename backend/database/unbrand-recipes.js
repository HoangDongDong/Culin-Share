const fs=require('node:fs/promises'),mysql=require('mysql2/promise'),dotenv=require('dotenv');
const {args}=require('./import-vifoodrec');
const {hash}=require('./imports/vifoodrec');
const {unbrand}=require('./imports/unbrand-recipes-v1');
async function main(){
    const o=args(process.argv.slice(2));
    if(!o.database||!/^[a-zA-Z0-9_]+$/.test(o.database))throw Error('Phải chỉ rõ --database hợp lệ');
    const env=o['env-file']?{...dotenv.parse(await fs.readFile(o['env-file'])),...process.env}:process.env;
    const host=o.host||'127.0.0.1';
    if(!['127.0.0.1','localhost','::1'].includes(host)&&!o['allow-remote'])throw Error('Database ngoài local yêu cầu --allow-remote');
    const c=await mysql.createConnection(require('../src/config/databaseOptions')({...env,DB_HOST:host,DB_PORT:o.port||'3306',DB_NAME:o.database,DB_USER:o.user||env.DB_USER||'root',DB_PASSWORD:env.IMPORT_DB_PASSWORD||env.DB_PASSWORD||''}));
    const lock='vfr:'+hash(o.database).slice(0,40);
    try{
        const [[r]]=await c.query('SELECT GET_LOCK(?,10) AS acquired',[lock]);if(Number(r.acquired)!==1)throw Error('Một tiến trình khác đang chạy');
        const result=await unbrand(c,{apply:!!o.apply});
        const report=o.report||'.cache/vifoodrec/unbrand-report.json';await fs.writeFile(report,JSON.stringify(result,null,2));
        console.log(JSON.stringify({...result.summary,applied:!!o.apply,report},null,2));
    }finally{await c.query('SELECT RELEASE_LOCK(?)',[lock]);await c.end();}
}
main().catch(e=>{console.error(e.code||e.message);process.exitCode=1});
