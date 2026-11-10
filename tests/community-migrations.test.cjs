const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runMigrations, splitSql, baselineStatements, checksum } = require('../backend/database/runner');

function database() {
    const migrations = new Map(), seeds = new Map(), statements = [];
    const state = { failDdl: false, rolledBack: false, commits: 0, id: 100, empty: false };
    const connection = {
        escape: value => `'${value.replaceAll("'", "''")}'`,
        async query(sql, params = []) {
            statements.push(sql);
            if (sql === 'SELECT DATABASE() AS database_name') return [[{ database_name: 'test' }]];
            if (sql.includes('GET_LOCK')) return [[{ acquired: 1 }]];
            if (sql.includes('RELEASE_LOCK')) return [[{ released: 1 }]];
            if (sql.includes('information_schema.TABLES')) return [state.empty ? [] : [{ name: 'users' }, { name: 'recipes' }, { name: 'notifications' }]];
            if (sql.includes('information_schema.COLUMNS') && sql.includes("COLUMN_NAME = 'type'")) return [[{ type: "enum('comment','review','follow','existing_custom')" }]];
            if (sql.includes('information_schema.') && sql.includes('COUNT(*) AS n')) return [[{n:0}]];
            if (sql.includes('information_schema.')) return [[]];
            if (/^SELECT id,(?:id|recipe_id) AS recipe_id,/.test(sql)) return [[]];
            if (sql.startsWith('SELECT checksum')) {
                const ledger = sql.includes('schema_seeds') ? seeds : migrations;
                return [ledger.has(params[0]) ? [{ checksum: ledger.get(params[0]), state: 'applied' }] : []];
            }
            if (sql.startsWith('INSERT INTO schema_')) {
                (sql.includes('schema_seeds') ? seeds : migrations).set(params[0], params[1]);
                return [{ insertId: ++state.id }];
            }
            if (sql.includes('CREATE TABLE IF NOT EXISTS community_post_media') && state.failDdl) {
                state.failDdl = false; throw new Error('simulated DDL interruption');
            }
            if (sql.startsWith('SELECT id, username, email FROM users')) return [[]];
            if (sql.includes('SELECT id, title, cover_image_url')) return [[{ id: 9, title: 'Món thử', cover_image_url: '/cover.jpg' }]];
            return [{ insertId: ++state.id }];
        },
        async beginTransaction() { statements.push('BEGIN'); },
        async commit() { state.commits++; },
        async rollback() { state.rolledBack = true; },
    };
    return { connection, migrations, seeds, statements, state };
}

test('SQL splitter preserves Vietnamese values, escaped quotes and semicolons', () => {
    assert.deepEqual(splitSql("-- heading\nINSERT INTO t VALUES ('món; ngon -- không phải comment', 'it''s'); /* comment */ SELECT 1;"),
        ["INSERT INTO t VALUES ('món; ngon -- không phải comment', 'it''s')", 'SELECT 1']);
    assert.throws(() => splitSql("INSERT INTO t VALUES ('unfinished"));
    assert.equal(checksum('a\r\nb'), checksum('a\nb'));
});

test('fresh-database baseline never executes DROP DATABASE, DROP TABLE or USE', () => {
    const source = fs.readFileSync(path.join(__dirname, '../backend/database/init.sql'), 'utf8');
    const statements = baselineStatements(source);
    assert.ok(statements.some(sql => sql.startsWith('CREATE TABLE IF NOT EXISTS users')));
    assert.ok(statements.some(sql => sql.startsWith('INSERT INTO users')));
    assert.ok(statements.every(sql => /^(CREATE TABLE IF NOT EXISTS|INSERT INTO)/i.test(sql)));
    assert.throws(() => baselineStatements('DELETE FROM users;'));
});

test('schema and demo data run once, keep existing notification types and use only demo identities', async () => {
    const db = database();
    const first = await runMigrations({ connection: db.connection, seed: true, log() {} });
    assert.deepEqual(first, { migrations: 9, seeds: 2 });
    const inserts = db.statements.filter(sql => sql.startsWith('INSERT INTO community_posts')).length;
    const second = await runMigrations({ connection: db.connection, seed: true, log() {} });
    assert.deepEqual(second, { migrations: 0, seeds: 0 });
    assert.equal(db.statements.filter(sql => sql.startsWith('INSERT INTO community_posts')).length, inserts);
    assert.equal(inserts, 4);
    assert.ok(db.statements.some(sql => sql.includes('existing_custom') && sql.includes('community_reply')));
    assert.ok(db.statements.every(sql => !/^DROP |^DELETE |^TRUNCATE /i.test(sql)));
    assert.ok(db.statements.some(sql => sql.includes('FOREIGN KEY (post_id, parent_id)')));
    assert.ok(db.statements.at(-1).includes('RELEASE_LOCK'));
});

test('interrupted DDL can be retried without marking the version as applied', async () => {
    const db = database(); db.state.failDdl = true;
    await assert.rejects(runMigrations({ connection: db.connection, seed: false, log() {} }), /simulated/);
    assert.equal(db.migrations.size, 0);
    assert.ok(db.statements.at(-1).includes('RELEASE_LOCK'));
    assert.deepEqual(await runMigrations({ connection: db.connection, seed: false, log() {} }), { migrations: 9, seeds: 0 });
});

test('an edited applied migration stops instead of replaying changes', async () => {
    const db = database(); db.migrations.set('202610280001-community', 'wrong-hash');
    await assert.rejects(runMigrations({ connection: db.connection, seed: false, log() {} }), /file bị sửa/);
    assert.ok(!db.statements.some(sql => sql.includes('CREATE TABLE IF NOT EXISTS community_posts')));
});

test('seed failures roll back and do not create a successful seed record', async t => {
    const db = database();
    const seed = require('../backend/database/seeds/202610280001-community-demo');
    t.mock.method(seed, 'up', async () => { throw new Error('seed failure'); });
    await assert.rejects(runMigrations({ connection: db.connection, seed: true, log() {} }), /seed failure/);
    assert.equal(db.seeds.size, 0);
    assert.equal(db.state.rolledBack, true);
});

test('new development database bootstraps the baseline without reset statements', async () => {
    const db = database(); db.state.empty = true;
    await runMigrations({ connection: db.connection, seed: false, log() {} });
    assert.ok(db.statements.some(sql => sql.startsWith('CREATE TABLE IF NOT EXISTS users')));
    assert.ok(db.statements.some(sql => sql.startsWith('INSERT INTO users')));
    assert.ok(db.statements.every(sql => !/^DROP |^USE |^TRUNCATE /i.test(sql)));
});

test('production bootstraps schema without either baseline or community demo records', async () => {
    const previous = process.env.NODE_ENV; process.env.NODE_ENV = 'production';
    try {
        const db = database(); db.state.empty = true;
        const result = await runMigrations({ connection: db.connection, log() {} });
        assert.equal(result.seeds, 0);
        assert.ok(db.statements.some(sql => sql.startsWith('CREATE TABLE IF NOT EXISTS users')));
        assert.ok(!db.statements.some(sql => /^INSERT INTO (users|recipes|community_posts)/.test(sql)));
    } finally { if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous; }
});
