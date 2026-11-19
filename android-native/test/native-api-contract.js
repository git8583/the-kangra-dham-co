// Run from the repository root with Node 22 and the existing dependencies.
// The server uses a temporary database and an ephemeral loopback port.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

async function main() {
    const root = process.cwd();
    assert.ok(fs.existsSync(path.join(root, 'server.js')), 'Run from the repository root.');
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'kangra-native-contract-'));
    const database = path.join(directory, 'test.sqlite');
    const password = 'TEST-ONLY-initial-password';
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = `scrypt:${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
    const wrapper = `
        const http = require('node:http');
        const listen = http.Server.prototype.listen;
        http.Server.prototype.listen = function (...args) {
            this.once('listening', () => process.send({ port: this.address().port }));
            return listen.apply(this, args);
        };
        require(process.env.KANGRA_TEST_ROOT + '/server.js');
    `;
    const server = spawn(process.execPath, ['-e', wrapper], {
        cwd: root,
        env: {
            ...process.env,
            KANGRA_TEST_ROOT: root,
            NODE_ENV: 'development',
            HOST: '127.0.0.1',
            PORT: '0',
            TRUST_PROXY: '',
            DATABASE_PATH: database,
            COOKIE_SECRET: 'test-only-cookie-secret',
            ADMIN_PASSWORD_HASH: hash
        },
        stdio: ['ignore', 'pipe', 'pipe', 'ipc']
    });
    let errors = '';
    server.stderr.on('data', chunk => { errors += chunk.toString(); });
    server.stdout.resume();
    try {
        const port = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Test server did not start.')), 20000);
            server.once('message', message => { clearTimeout(timeout); resolve(message.port); });
            server.once('exit', code => { clearTimeout(timeout); reject(new Error(`Test server exited (${code}): ${errors}`)); });
            server.once('error', error => { clearTimeout(timeout); reject(error); });
        });
        const base = `http://127.0.0.1:${port}`;
        if (process.env.KANGRA_NATIVE_CLIENT_CP) {
            await new Promise((resolve, reject) => {
                const java = spawn('java', ['-Xmx128m', '-cp', process.env.KANGRA_NATIVE_CLIENT_CP,
                    'co.thekangradham.nativeapp.NativeBackendContract', base, password],
                { stdio: 'inherit' });
                java.once('error', reject);
                java.once('exit', code => code === 0 ? resolve() : reject(new Error(`Native client contract failed (${code}).`)));
            });
        }
        async function request(url, method = 'GET', body, headers = {}) {
            return fetch(base + url, {
                method,
                headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers },
                ...(body === undefined ? {} : { body: JSON.stringify(body) }),
                redirect: 'manual'
            });
        }

        assert.equal((await request('/api/health')).status, 200);
        assert.equal((await request('/api/admin/enquiries')).status, 401);
        const submission = await request('/api/enquiries/contact', 'POST', {
            name: 'TEST PLEASE IGNORE', email: 'test@example.test', subject: 'general',
            message: 'TEST PLEASE IGNORE isolated native API test.'
        });
        assert.equal(submission.status, 201);
        const { id } = await submission.json();

        const login = await request('/api/admin/login', 'POST', { password });
        assert.equal(login.status, 200);
        const cookie = login.headers.get('set-cookie').split(';', 1)[0];
        const { csrfToken } = await login.json();
        const authenticated = { Cookie: cookie };
        const writeHeaders = { ...authenticated, 'X-CSRF-Token': csrfToken };
        const enquiries = await request('/api/admin/enquiries', 'GET', undefined, authenticated);
        assert.equal((await enquiries.json()).find(item => item.id === id).status, 'new');
        assert.equal((await request(`/api/admin/enquiries/${id}`, 'PATCH', { status: 'closed' }, authenticated)).status, 403);
        assert.equal((await request(`/api/admin/enquiries/${id}`, 'PATCH', { status: 'closed' }, writeHeaders)).status, 200);

        const currentMenu = await (await request('/api/menu')).json();
        assert.equal(currentMenu.menu.daily.length, 7);
        assert.equal((await request('/api/admin/menu', 'PUT', { menu: currentMenu.menu, override: 3 }, writeHeaders)).status, 200);
        assert.equal((await (await request('/api/menu')).json()).override, 3);
        assert.equal((await request('/api/admin/password', 'PUT', {
            currentPassword: password, newPassword: 'TEST-ONLY-new-password'
        }, writeHeaders)).status, 200);
        assert.equal((await request(`/api/admin/enquiries/${id}`, 'DELETE', undefined, writeHeaders)).status, 204);
        assert.equal((await request('/api/admin/logout', 'POST', undefined, writeHeaders)).status, 204);
        assert.equal((await request('/api/admin/enquiries', 'GET', undefined, authenticated)).status, 401);
        console.log('Isolated backend contract checks passed.');
    } finally {
        if (server.exitCode === null) {
            const exited = new Promise(resolve => server.once('exit', resolve));
            server.kill();
            await exited;
        }
        for (const suffix of ['', '-wal', '-shm']) {
            const file = database + suffix;
            if (fs.existsSync(file)) fs.unlinkSync(file);
        }
        fs.rmdirSync(directory);
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
