require('dotenv').config({ path: require('node:path').join(__dirname, '../.env') });
const { runMigrations } = require('./runner');
const args = new Set(process.argv.slice(2));
const options = {};
if (args.has('--seed')) options.seed = true;
if (args.has('--no-seed')) options.seed = false;
runMigrations(options).then(result => {
 console.log('Database đã cập nhật:', result.migrations, 'migration mới,', result.seeds, 'seed mới. Không xóa dữ liệu cũ.');
}).catch(error => {
 console.error('Không cập nhật được database:', error.message || error.code);
 process.exitCode = 1;
});
