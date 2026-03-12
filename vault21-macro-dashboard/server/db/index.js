const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

let db;

/**
 * Add a missing column to an existing table without disturbing existing data.
 *
 * @param {import('better-sqlite3').Database} dbConn
 * @param {string} tableName
 * @param {string} columnName
 * @param {string} columnDefinition
 */
function ensureColumn(dbConn, tableName, columnName, columnDefinition) {
  const columns = dbConn.prepare(`PRAGMA table_info(${tableName})`).all();
  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    dbConn.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
    logger.info({ tableName, columnName }, 'Database column added');
  }
}

function getDb() {
  if (db) return db;

  // Ensure data directory exists
  const dbDir = path.dirname(config.dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(config.dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  logger.info({ path: config.dbPath }, 'Database connected');
  return db;
}

function initSchema() {
  const db = getDb();
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schema);
  ensureColumn(db, 'events', 'event_time', 'TEXT');
  logger.info('Database schema initialized');
}

function close() {
  if (db) {
    db.close();
    db = null;
    logger.info('Database connection closed');
  }
}

module.exports = { getDb, initSchema, close };
