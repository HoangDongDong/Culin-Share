const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const databaseOptions = require('../backend/src/config/databaseOptions');

test('TiDB uses TLS with certificate verification and numeric port', () => {
    const config = databaseOptions({ DB_HOST: 'example.aws.tidbcloud.com', DB_USER: 'user', DB_PASSWORD: 'password' });
    assert.equal(config.port, 4000);
    assert.equal(config.database, 'culinshare');
    assert.deepEqual(config.ssl, { minVersion: 'TLSv1.2', rejectUnauthorized: true });
    assert.equal(databaseOptions({ DB_PORT: '4000' }).ssl.rejectUnauthorized, true);
});

test('local MySQL stays usable without TLS; explicit TLS and Vercel enforce verification', () => {
    const local = databaseOptions({ DB_NAME: 'local', DB_PORT: '3306' });
    assert.equal(local.port, 3306);
    assert.equal(local.database, 'local');
    assert.equal(local.ssl, undefined);
    assert.equal(local.password, '');
    assert.equal(databaseOptions({ DB_SSL: 'true' }).ssl.rejectUnauthorized, true);
    assert.equal(databaseOptions({ VERCEL: '1', DB_SSL: 'false' }).ssl.rejectUnauthorized, true);
});

test('Vercel exports the Express app without listening, sockets or startup migrations', () => {
    const app = { disable() {}, use() {}, get() {} };
    const express = Object.assign(() => app, { json() {}, urlencoded() {} });
    let sockets = 0, listeners = 0, migrations = 0;
    const sandbox = {
        module: { exports: {} }, process: { env: { VERCEL: '1' } }, console,
        require(id) {
            if (id === 'dotenv') return { config() {} };
            if (id === 'express') return express;
            if (id === 'http') return { createServer: () => ({ listen() { listeners++; } }) };
            if (id === 'cors') return () => () => {};
            if (id === './src/config/socket') return { initSocket() { sockets++; } };
            if (id === './database/runner') return { runMigrations() { migrations++; } };
            if (id === './src/middlewares/securityMiddleware') return { writeOriginGuard() {}, securityHeaders() {} };
            if (id.startsWith('./src/routes/') || id === './src/config/database') return {};
            throw new Error(`Unexpected import: ${id}`);
        },
    };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../backend/server.js'), 'utf8'), sandbox);
    assert.equal(sandbox.module.exports, app);
    assert.equal(sockets, 0);
    assert.equal(listeners, 0);
    assert.equal(migrations, 0);
});
