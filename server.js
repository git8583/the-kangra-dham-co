require('dotenv').config();

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { createDatabase } = require('./lib/database');
const { validateEnquiry, validateMenu } = require('./lib/validation');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

if (IS_PRODUCTION) {
    if (!process.env.COOKIE_SECRET || process.env.COOKIE_SECRET.length < 32) {
        throw new Error('COOKIE_SECRET must contain at least 32 characters in production.');
    }
    if (!/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(process.env.ADMIN_PASSWORD_HASH || '')) {
        throw new Error('ADMIN_PASSWORD_HASH is missing or invalid in production.');
    }
}

const databasePath = path.resolve(ROOT, process.env.DATABASE_PATH || 'data/kangra-dham.sqlite');
const db = createDatabase(databasePath, path.join(ROOT, 'data', 'menu.json'));
const app = express();

if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY));
app.disable('x-powered-by');
app.use((req, res, next) => {
    res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    next();
});
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
            imgSrc: ["'self'", 'data:', 'https://upload.wikimedia.org', 'https://images.pexels.com', 'https://cdn.pixabay.com', 'https://www.google-analytics.com'],
            connectSrc: ["'self'", 'https://www.google-analytics.com', 'https://www.googletagmanager.com'],
            frameSrc: ['https://www.google.com'],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            frameAncestors: ["'self'"],
            upgradeInsecureRequests: IS_PRODUCTION ? [] : null
        }
    },
    crossOriginEmbedderPolicy: false,
    strictTransportSecurity: IS_PRODUCTION
}));
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'development-only-secret'));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 150, standardHeaders: 'draft-8', legacyHeaders: false });
const formLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: 'draft-8', legacyHeaders: false });
app.use('/api', apiLimiter);
app.use('/api/admin', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

function randomToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('base64url');
}

function sha256(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}

function safeEqual(left, right) {
    const a = Buffer.from(left);
    const b = Buffer.from(right);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function verifyPassword(password) {
    const saved = db.prepare("SELECT value FROM settings WHERE key = 'admin_password_hash'").get();
    const encoded = saved?.value || process.env.ADMIN_PASSWORD_HASH || '';
    const [algorithm, salt, expected] = encoded.split(':');
    if (algorithm !== 'scrypt' || !salt || !expected) return false;
    const actual = crypto.scryptSync(password, salt, 64).toString('hex');
    return safeEqual(actual, expected);
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    return `scrypt:${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}

function requireAdmin(req, res, next) {
    const token = req.signedCookies.kdc_admin;
    if (!token) return res.status(401).json({ error: 'Authentication required.' });
    const session = db.prepare('SELECT csrf_token, expires_at FROM admin_sessions WHERE token_hash = ?').get(sha256(token));
    if (!session || session.expires_at <= Date.now()) {
        if (session) db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(sha256(token));
        return res.status(401).json({ error: 'Session expired.' });
    }
    req.adminSession = session;
    next();
}

function requireCsrf(req, res, next) {
    const supplied = req.get('X-CSRF-Token') || '';
    if (!safeEqual(supplied, req.adminSession.csrf_token)) {
        return res.status(403).json({ error: 'Invalid security token.' });
    }
    next();
}

app.get('/api/health', (req, res) => {
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok', database: 'ok' });
});

app.get('/api/menu', (req, res) => {
    const menu = JSON.parse(db.prepare("SELECT value FROM settings WHERE key = 'menu'").get().value);
    const override = JSON.parse(db.prepare("SELECT value FROM settings WHERE key = 'menu_override'").get().value);
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json({ menu, override });
});

app.post('/api/enquiries/:type', formLimiter, (req, res) => {
    try {
        const type = req.params.type;
        if (!['contact', 'catering'].includes(type)) return res.status(404).json({ error: 'Unknown enquiry type.' });
        const entry = validateEnquiry(req.body, type);
        const result = db.prepare(`
            INSERT INTO enquiries (type, name, email, phone, subject, company, service, guests, message)
            VALUES (@type, @name, @email, @phone, @subject, @company, @service, @guests, @message)
        `).run(entry);
        res.status(201).json({ id: result.lastInsertRowid, message: 'Thank you. Your enquiry has been received.' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/admin/login', loginLimiter, (req, res) => {
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!verifyPassword(password)) return res.status(401).json({ error: 'Invalid credentials.' });
    db.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').run(Date.now());
    const token = randomToken();
    const csrfToken = randomToken();
    const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
    db.prepare('INSERT INTO admin_sessions (token_hash, csrf_token, expires_at) VALUES (?, ?, ?)').run(sha256(token), csrfToken, expiresAt);
    res.cookie('kdc_admin', token, {
        signed: true,
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: 'strict',
        maxAge: 8 * 60 * 60 * 1000,
        path: '/'
    });
    res.json({ csrfToken });
});

app.get('/api/admin/session', requireAdmin, (req, res) => {
    res.json({ authenticated: true, csrfToken: req.adminSession.csrf_token });
});

app.post('/api/admin/logout', requireAdmin, requireCsrf, (req, res) => {
    db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(sha256(req.signedCookies.kdc_admin));
    res.clearCookie('kdc_admin', { path: '/' });
    res.status(204).end();
});

app.put('/api/admin/password', requireAdmin, requireCsrf, (req, res) => {
    const currentPassword = typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';
    const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
    if (!verifyPassword(currentPassword)) return res.status(401).json({ error: 'Current password is incorrect.' });
    if (newPassword.length < 12 || newPassword.length > 128) {
        return res.status(400).json({ error: 'New password must contain 12–128 characters.' });
    }
    if (currentPassword === newPassword) {
        return res.status(400).json({ error: 'Choose a new password that differs from the current password.' });
    }
    db.prepare(`
        INSERT INTO settings (key, value, updated_at) VALUES ('admin_password_hash', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `).run(hashPassword(newPassword));
    res.json({ updated: true });
});

app.get('/api/admin/enquiries', requireAdmin, (req, res) => {
    const rows = db.prepare('SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 500').all();
    res.json(rows);
});

app.patch('/api/admin/enquiries/:id', requireAdmin, requireCsrf, (req, res) => {
    if (!['new', 'contacted', 'closed'].includes(req.body.status)) {
        return res.status(400).json({ error: 'Invalid enquiry status.' });
    }
    const result = db.prepare('UPDATE enquiries SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(req.body.status, Number(req.params.id));
    if (!result.changes) return res.status(404).json({ error: 'Enquiry not found.' });
    res.json({ updated: true });
});

app.delete('/api/admin/enquiries/:id', requireAdmin, requireCsrf, (req, res) => {
    const result = db.prepare('DELETE FROM enquiries WHERE id = ?').run(Number(req.params.id));
    if (!result.changes) return res.status(404).json({ error: 'Enquiry not found.' });
    res.status(204).end();
});

app.put('/api/admin/menu', requireAdmin, requireCsrf, (req, res) => {
    try {
        const menu = validateMenu(req.body.menu);
        const override = req.body.override === null ? null : Number(req.body.override);
        if (override !== null && (!Number.isInteger(override) || override < 0 || override > 6)) {
            throw new Error('Menu override must be a day from 0 to 6 or null.');
        }
        const update = db.transaction(() => {
            db.prepare("UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = 'menu'").run(JSON.stringify(menu));
            db.prepare("UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = 'menu_override'").run(JSON.stringify(override));
        });
        update();
        res.json({ saved: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

const allowedRootFiles = new Set([
    'index.html', 'about.html', 'admin.html', 'catering.html', 'contact.html', 'corporate.html',
    'gallery.html', 'locations.html', 'menu.html', 'offline.html', 'order.html', 'stories.html',
    'privacy.html', 'manifest.json', 'robots.txt', 'sitemap.xml', 'sw.js'
]);
app.use('/css', express.static(path.join(ROOT, 'css'), { maxAge: IS_PRODUCTION ? '1h' : 0 }));
app.use('/js', express.static(path.join(ROOT, 'js'), { maxAge: IS_PRODUCTION ? '1h' : 0 }));
app.use('/icons', express.static(path.join(ROOT, 'icons'), { maxAge: IS_PRODUCTION ? '30d' : 0, immutable: IS_PRODUCTION }));
app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));
app.get('/:file', (req, res, next) => {
    if (!allowedRootFiles.has(req.params.file)) return next();
    if (req.params.file === 'admin.html') res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(ROOT, req.params.file));
});
app.use((req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found.' });
    res.status(404).sendFile(path.join(ROOT, 'offline.html'));
});
app.use((error, req, res, next) => {
    console.error(error);
    if (res.headersSent) return next(error);
    res.status(500).json({ error: 'Internal server error.' });
});

const server = app.listen(PORT, HOST, () => {
    console.log(`Kangra Dham server listening on http://${HOST}:${PORT}`);
});

function shutdown(signal) {
    console.log(`${signal} received, shutting down.`);
    server.close(() => {
        db.close();
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = { app, db };
