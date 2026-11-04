// Shared by the application pool and the migration connection.
function databaseOptions(env = process.env) {
    const tidb = /(^|\.)tidbcloud\.com$/i.test(env.DB_HOST || '') || Number(env.DB_PORT) === 4000;
    const tls = Boolean(env.VERCEL) || tidb || env.DB_SSL === 'true';
    return {
        host: env.DB_HOST || 'localhost',
        port: Number(env.DB_PORT || (tidb ? 4000 : 3306)),
        user: env.DB_USER || 'root',
        password: env.DB_PASSWORD || '',
        database: env.DB_NAME || (tidb || env.VERCEL ? 'culinshare' : 'CulinShare'),
        ...(tls ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } } : {}),
    };
}

module.exports = databaseOptions;
