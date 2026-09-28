require('dotenv').config({ path: __dirname + '/../.env' });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function migrate() {
    console.log('⏳ Đang kết nối tới MySQL...');
    // Connect without database first
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '123456',
        multipleStatements: true
    });

    console.log('✅ Kết nối thành công. Đang đọc file init.sql...');
    const initSqlPath = path.join(__dirname, 'init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');

    // Split SQL by statements (ignoring comments)
    // We clean comments and split by semi-colons
    const cleanSql = initSql
        .replace(/--.*$/gm, '') // remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, ''); // remove multi-line comments

    const statements = cleanSql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

    console.log(`📋 Tìm thấy ${statements.length} câu lệnh SQL. Đang thực thi...`);

    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        try {
            await connection.query(stmt);
        } catch (error) {
            console.error(`❌ Lỗi tại câu lệnh thứ ${i + 1}:`);
            console.error(stmt);
            console.error(error.message);
            await connection.end();
            process.exit(1);
        }
    }

    console.log('🎉 Khởi tạo cơ sở dữ liệu và seed dữ liệu CulinShare thành công!');
    await connection.end();
}

migrate().catch(err => {
    console.error('❌ Lỗi di chuyển dữ liệu:', err);
    process.exit(1);
});
