const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const mysql = require('mysql2/promise');

const checksum = source => createHash('sha256').update(source.replace(/\r\n/g, '\n')).digest('hex');

// Split delimiters outside quotes; preserve semicolons in seed text.
function splitSql(source) {
    const statements = [];
    let buffer = '', quote = null, lineComment = false, blockComment = false;
    for (let i = 0; i < source.length; i++) {
        const ch = source[i], next = source[i + 1];
        if (lineComment) { if (ch === '\n') { lineComment = false; buffer += '\n'; } continue; }
        if (blockComment) { if (ch === '*' && next === '/') { blockComment = false; buffer += ' '; i++; } continue; }
        if (quote) {
            buffer += ch;
            if (ch === '\\') { if (next !== undefined) buffer += source[++i]; }
            else if (ch === quote) { if (next === quote) buffer += source[++i]; else quote = null; }
            continue;
        }
        if (ch === '-' && next === '-' && /\s/.test(source[i + 2] || ' ')) { lineComment = true; i++; continue; }
        if (ch === '#') { lineComment = true; continue; }
        if (ch === '/' && next === '*') { blockComment = true; i++; continue; }
        if (ch === "'" || ch === '"' || ch === '`') { quote = ch; buffer += ch; continue; }
        if (ch === ';') { if (buffer.trim()) statements.push(buffer.trim()); buffer = ''; }
        else buffer += ch;
    }
    if (quote || blockComment) throw new Error('File SQL có chuỗi hoặc chú thích chưa đóng.');
    if (buffer.trim()) statements.push(buffer.trim());
    return statements;
}

function baselineStatements(source) {
    return splitSql(source).filter(sql => !/^(DROP\s+(DATABASE|TABLE)|CREATE\s+DATABASE|USE\s+)/i.test(sql))
        .map(sql => {
            if (/^CREATE\s+TABLE\s+/i.test(sql)) return sql.replace(/^CREATE\s+TABLE\s+/i, 'CREATE TABLE IF NOT EXISTS ');
            if (/^INSERT\s+INTO\s+/i.test(sql)) return sql;
            throw new Error('Baseline chứa câu lệnh không được hỗ trợ; dừng để bảo vệ dữ liệu.');
        });
}

async function connect() {
    const database = process.env.DB_NAME || 'CulinShare';
    const config = {
        host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '123456',
        connectTimeout: 10000, charset: 'utf8mb4',
    };
    try { return await mysql.createConnection({ ...config, database }); }
    catch (error) {
        if (error.code !== 'ER_BAD_DB_ERROR') throw error;
        const connection = await mysql.createConnection(config);
        try {
            await connection.query(`CREATE DATABASE IF NOT EXISTS ${connection.escapeId(database)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
            await connection.changeUser({ database });
            return connection;
        } catch (createError) { await connection.end(); throw createError; }
    }
}

async function ensureBaseline(connection) {
    const version = '000000000000-initial-schema';
    const [previous] = await connection.query('SELECT checksum, state FROM schema_migrations WHERE version = ?', [version]);
    const [tables] = await connection.query(`SELECT TABLE_NAME AS name FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME NOT IN ('schema_migrations','schema_seeds')`);
    if (previous[0]?.state === 'applied') return;
    if (!previous.length && tables.length) {
        if (!['users', 'recipes', 'notifications'].every(name => tables.some(table => table.name === name))) {
            throw new Error('Database đã có dữ liệu nhưng thiếu bảng nền users/recipes/notifications. Không tự khởi tạo đè; cần kiểm tra schema.');
        }
        return;
    }
    const source = await fs.readFile(path.join(__dirname, 'init.sql'), 'utf8');
    const hash = checksum(source);
    if (previous.length && previous[0].checksum !== hash) throw new Error('Baseline đang chạy dở đã thay đổi nội dung; cần kiểm tra trước khi tiếp tục.');
    if (!previous.length) await connection.query("INSERT INTO schema_migrations (version, checksum, state, applied_at) VALUES (?, ?, 'running', NULL)", [version, hash]);
    const statements = baselineStatements(source);
    for (const sql of statements.filter(sql => /^CREATE TABLE/i.test(sql))) await connection.query(sql);
    await connection.beginTransaction();
    try {
        if (process.env.NODE_ENV !== 'production') {
            for (const sql of statements.filter(sql => /^INSERT INTO/i.test(sql))) await connection.query(sql);
        }
        await connection.query("UPDATE schema_migrations SET state = 'applied', applied_at = CURRENT_TIMESTAMP WHERE version = ?", [version]);
        await connection.commit();
    } catch (error) { await connection.rollback(); throw error; }
}

async function applyVersions(connection, directory, ledger, transactional, log) {
    const files = (await fs.readdir(directory)).filter(file => /^\d{12}-[a-z0-9-]+\.js$/.test(file)).sort();
    let applied = 0;
    for (const file of files) {
        const filePath = path.join(directory, file), version = file.replace(/\.js$/, '');
        const hash = checksum(await fs.readFile(filePath, 'utf8'));
        const [previous] = await connection.query(`SELECT checksum FROM ${ledger} WHERE version = ?`, [version]);
        if (previous.length) {
            if (previous[0].checksum !== hash) throw new Error(`Phiên bản ${version} đã chạy nhưng file bị sửa. Hãy tạo phiên bản mới.`);
            continue;
        }
        const migration = require(filePath);
        if (transactional) await connection.beginTransaction();
        try {
            await migration.up(connection);
            await connection.query(`INSERT INTO ${ledger} (version, checksum) VALUES (?, ?)`, [version, hash]);
            if (transactional) await connection.commit();
            applied++;
            log(`Đã áp dụng ${transactional ? 'seed' : 'migration'}: ${version}`);
        } catch (error) { if (transactional) await connection.rollback(); throw error; }
    }
    return applied;
}

async function runMigrations({ connection: provided, seed = process.env.COMMUNITY_SEED_DEMO !== 'false' && process.env.NODE_ENV !== 'production', log = console.log } = {}) {
    const connection = provided || await connect();
    let locked = false, lockName;
    try {
        const [[{ database_name: database }]] = await connection.query('SELECT DATABASE() AS database_name');
        lockName = `culinshare:migrate:${checksum(database).slice(0, 40)}`;
        const [[lock]] = await connection.query('SELECT GET_LOCK(?, 30) AS acquired', [lockName]);
        if (Number(lock.acquired) !== 1) throw new Error('Có tiến trình khác đang cập nhật database. Vui lòng thử lại.');
        locked = true;
        await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
            version VARCHAR(100) PRIMARY KEY, checksum CHAR(64) NOT NULL,
            state ENUM('running','applied') NOT NULL DEFAULT 'applied',
            applied_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
        await connection.query(`CREATE TABLE IF NOT EXISTS schema_seeds (
            version VARCHAR(100) PRIMARY KEY, checksum CHAR(64) NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
        await ensureBaseline(connection);
        const migrations = await applyVersions(connection, path.join(__dirname, 'migrations'), 'schema_migrations', false, log);
        const seeds = seed ? await applyVersions(connection, path.join(__dirname, 'seeds'), 'schema_seeds', true, log) : 0;
        return { migrations, seeds };
    } finally {
        try { if (locked) await connection.query('SELECT RELEASE_LOCK(?)', [lockName]); }
        finally { if (!provided) await connection.end(); }
    }
}

module.exports = { runMigrations, splitSql, baselineStatements, checksum, applyVersions };
