const fs=require('node:fs/promises');
const path=require('node:path');
const mysql=require('mysql2/promise');
const dotenv=require('dotenv');
const dataset=require('./imports/vifoodrec');
const {lockedImport,rollbackBatch}=require('./imports/vifoodrec-store');
const migration=require('./migrations/202611050001-recipe-imports');

function args(argv){
    const flags={};const boolean=new Set(['download','audit','apply','allow-remote','ensure-schema']);
    const values=new Set(['database','host','port','user','env-file','status','report','cache','image-report','rollback-batch']);
    for(let i=0;i<argv.length;i++){const name=argv[i].replace(/^--/,'');if(boolean.has(name))flags[name]=true;else if(values.has(name)){if(!argv[i+1]||argv[i+1].startsWith('--'))throw Error('Thiếu giá trị --'+name);flags[name]=argv[++i];}else throw Error('Tham số không hợp lệ: '+argv[i]);}
    return flags;
}
async function load(cache,{download=false}={}){
    await fs.mkdir(cache,{recursive:true});const inputs=[];
    for(const source of dataset.SOURCES){const file=path.join(cache,source.file);let bytes;
        try{bytes=await fs.readFile(file);}catch(error){if(!download)throw Error('Thiếu CSV; chạy với --download');}
        if(!bytes&&download){const url='https://raw.githubusercontent.com/QuocAn55/A-New-Dataset-and-Empirical-Evaluation-for-Vietnamese-Food-Recommendation-System/'+dataset.REVISION+'/'+source.remote.split('/').map(encodeURIComponent).join('/');const response=await fetch(url,{signal:AbortSignal.timeout(90000)});if(!response.ok)throw Error('Không tải được dataset HTTP '+response.status);bytes=Buffer.from(await response.arrayBuffer());if(dataset.hash(bytes)!==source.hash)throw Error('Checksum CSV không khớp');await fs.writeFile(file,bytes);}
        if(dataset.hash(bytes)!==source.hash)throw Error('Checksum CSV không khớp: '+source.file);
        inputs.push({source,rows:dataset.parseCsv(bytes.toString('utf8'))});
    }
    return dataset.prepare(inputs);
}
async function main(){
    const options=args(process.argv.slice(2));const cache=path.resolve(options.cache||path.join(__dirname,'../.cache/vifoodrec'));
    const prepared=await load(cache,{download:options.download});const counts=prepared.skipped.reduce((o,r)=>(o[r.reason]=(o[r.reason]||0)+1,o),{});
    let result={summary:{raw:prepared.records.length+prepared.skipped.length,eligibleBeforeExistingTitles:prepared.records.length,skipped:counts,quota:dataset.quotas(prepared.records.length)},skipped:prepared.skipped};
    if(!options.audit){
        if(!options.database)throw Error('Phải chỉ rõ --database. Dùng --audit để chỉ đọc file.');
        const env=options['env-file']?{...dotenv.parse(await fs.readFile(options['env-file'])),...process.env}:process.env;
        const host=options.host||env.IMPORT_DB_HOST||'127.0.0.1';
        if(!['127.0.0.1','localhost','::1'].includes(host)&&!options['allow-remote'])throw Error('Database ngoài local yêu cầu --allow-remote rõ ràng');
        if(!/^[a-zA-Z0-9_]+$/.test(options.database))throw Error('Tên database không hợp lệ');
        const config=require('../src/config/databaseOptions')({...env,DB_HOST:host,DB_PORT:options.port||env.IMPORT_DB_PORT||'3306',DB_USER:options.user||env.IMPORT_DB_USER||env.DB_USER||'root',DB_PASSWORD:env.IMPORT_DB_PASSWORD||env.DB_PASSWORD||'',DB_NAME:options.database});
        const connection=await mysql.createConnection({...config,connectTimeout:10000});
        try{
            if(options['rollback-batch']){if(!options.apply)throw Error('Rollback cần --apply');console.log(JSON.stringify(await rollbackBatch(connection,options['rollback-batch'])));return;}
            if(options['ensure-schema']){if(!options.apply)throw Error('--ensure-schema chỉ dùng cùng --apply');await migration.up(connection);}
            const imageResults=options['image-report']?JSON.parse(await fs.readFile(options['image-report'],'utf8')).results:{};
            result=await lockedImport(connection,prepared,{apply:!!options.apply,status:options.status||'draft',imageResults,log:console.log});
            delete result.plan;
        }finally{await connection.end();}
    }
    const report=path.resolve(options.report||path.join(cache,'import-report.json'));await fs.mkdir(path.dirname(report),{recursive:true});await fs.writeFile(report,JSON.stringify(result,null,2));
    console.log(JSON.stringify(result.summary,null,2));console.log('Báo cáo: '+report);
}
if(require.main===module)main().catch(error=>{console.error('Nhập ViFoodRec thất bại:',error.code||error.message);process.exitCode=1;});
module.exports={args,load};
