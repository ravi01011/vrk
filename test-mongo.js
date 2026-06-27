const { MongoClient } = require('mongodb');
const fs = require('fs');

function loadEnvLocal() {
    const p = './.env.local';
    if (!fs.existsSync(p)) return;
    const content = fs.readFileSync(p, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
        const m = line.match(/^([^=]+)=(?:"([^"]*)"|(.*))$/);
        if (m) {
            const key = m[1].trim();
            const val = (m[2] !== undefined) ? m[2] : (m[3] || '');
            process.env[key] = val;
        }
    });
}

async function tryConnect(name, uri, options) {
    console.log('\n=== Attempt:', name, '===');
    try {
        const client = new MongoClient(uri, options);
        await client.connect();
        console.log('Connected successfully — server info:', client.topology.s.description?.type || 'unknown');
        await client.close();
        return true;
    } catch (err) {
        console.error('Connection error:', err && err.stack ? err.stack : err);
        return false;
    }
}

async function main() {
    loadEnvLocal();
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI not set in environment or .env.local');
        process.exit(2);
    }

    const attempts = [
        { name: 'Default (URI)', options: {} },
        { name: 'serverApi v1', options: { serverApi: { version: '1' } } },
        { name: 'tlsAllowInvalidCertificates via options', options: { tlsAllowInvalidCertificates: true, serverApi: { version: '1' } } },
        { name: 'connectTimeoutMS 10000', options: { connectTimeoutMS: 10000, serverApi: { version: '1' } } },
    ];

    for (const a of attempts) {
        // ensure we pass a fresh options object
        await tryConnect(a.name, uri, { ...a.options });
    }
}

main().catch((e) => {
    console.error('Fatal:', e);
    process.exit(1);
});
