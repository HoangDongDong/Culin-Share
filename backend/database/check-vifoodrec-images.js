const fs=require('node:fs/promises'),path=require('node:path');
const {load}=require('./import-vifoodrec');
async function main(){
    const cache=path.join(__dirname,'../.cache/vifoodrec'),file=path.join(cache,'image-check.json');
    const {records}=await load(cache);let results={};try{results=JSON.parse(await fs.readFile(file,'utf8')).results||{};}catch{}
    const urls=[...new Set(records.map(row=>row.image))];const failures=new Map();let checked=0;
    for(let start=0;start<urls.length;start+=6){
        await Promise.all(urls.slice(start,start+6).map(async url=>{
            if(results[url]?.checkedAt)return;
            const host=new URL(url).hostname;
            if((failures.get(host)||0)>=6){results[url]={ok:false,reason:'host-unreachable-not-checked'};return;}
            try{
                const response=await fetch(url,{headers:{Range:'bytes=0-511'},signal:AbortSignal.timeout(8000)});
                const type=response.headers.get('content-type')||'';
                const reader=response.body?.getReader();let first;
                try{first=reader?await reader.read():null;}finally{await reader?.cancel();}
                const bytes=first?.value||[];
                const signature=(bytes[0]===0xff&&bytes[1]===0xd8)||(bytes[0]===0x89&&bytes[1]===0x50)||(String.fromCharCode(...bytes.slice(0,4))==='RIFF')||(String.fromCharCode(...bytes.slice(0,3))==='GIF');
                results[url]={ok:response.ok&&/^image\//i.test(type)&&signature,status:response.status,type,checkedAt:new Date().toISOString()};
            }catch(error){failures.set(host,(failures.get(host)||0)+1);results[url]={ok:false,reason:error.name==='TimeoutError'?'timeout':'connection-error',checkedAt:new Date().toISOString()};}
            checked++;
        }));
        if(start%120===0){await fs.writeFile(file,JSON.stringify({results},null,2));console.log(`Đã kiểm tra ${checked} ảnh; đã xử lý ${Math.min(start+6,urls.length)}/${urls.length} URL`);}
    }
    const summary={urls:urls.length,verified:urls.filter(url=>results[url]?.ok).length,notVerified:urls.filter(url=>!results[url]?.ok).length};
    await fs.writeFile(file,JSON.stringify({summary,results},null,2));console.log(JSON.stringify(summary));
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
