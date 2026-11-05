const fs = require('node:fs/promises');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const {args} = require('./import-vifoodrec');
const {hash} = require('./imports/vifoodrec');
const {reclassify} = require('./imports/recipe-categories-v1');

async function main() {
    const options = args(process.argv.slice(2));
    if (!options.database || !/^[a-zA-Z0-9_]+$/.test(options.database)) throw Error('Phải chỉ rõ --database hợp lệ');
    const env = options['env-file'] ? {...dotenv.parse(await fs.readFile(options['env-file'])), ...process.env} : process.env;
    const host = options.host || '127.0.0.1';
    if (!['127.0.0.1','localhost','::1'].includes(host) && !options['allow-remote']) throw Error('Database ngoài local yêu cầu --allow-remote');
    const c = await mysql.createConnection(require('../src/config/databaseOptions')({...env, DB_HOST:host, DB_PORT:options.port || '3306', DB_NAME:options.database, DB_USER:options.user || env.DB_USER || 'root', DB_PASSWORD:env.IMPORT_DB_PASSWORD || env.DB_PASSWORD || ''}));
    const lock = 'vfr:' + hash(options.database).slice(0,40);
    try {
        const [[locked]] = await c.query('SELECT GET_LOCK(?,10) AS acquired', [lock]);
        if (Number(locked.acquired) !== 1) throw Error('Một tiến trình nhập/phân loại khác đang chạy');
        const result = await reclassify(c, {apply: !!options.apply});
        const report = options.report || '.cache/vifoodrec/category-report.json';
        await fs.writeFile(report, JSON.stringify(result,null,2));
        console.log(JSON.stringify({total:result.total, changed:result.changed, groups:result.groups, applied:!!options.apply, report},null,2));
    } finally { await c.query('SELECT RELEASE_LOCK(?)', [lock]); await c.end(); }
}
main().catch(error => {console.error(error.code || error.message); process.exitCode=1;});
