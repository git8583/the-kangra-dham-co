const Database = require('better-sqlite3');
const fs = require('node:fs');
const path = require('node:path');

function createDatabase(databasePath, seedMenuPath) {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    const db = new Database(databasePath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');

    db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS enquiries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL CHECK(type IN ('contact', 'catering')),
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            subject TEXT,
            company TEXT,
            service TEXT,
            guests INTEGER,
            message TEXT,
            status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'contacted', 'closed')),
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON enquiries(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);
        CREATE TABLE IF NOT EXISTS admin_sessions (
            token_hash TEXT PRIMARY KEY,
            csrf_token TEXT NOT NULL,
            expires_at INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `);

    const existing = db.prepare("SELECT value FROM settings WHERE key = 'menu'").get();
    if (!existing) {
        const seed = fs.readFileSync(seedMenuPath, 'utf8');
        JSON.parse(seed);
        db.prepare("INSERT INTO settings (key, value) VALUES ('menu', ?)").run(seed);
        db.prepare("INSERT INTO settings (key, value) VALUES ('menu_override', 'null')").run();
    }

    return db;
}

module.exports = { createDatabase };
