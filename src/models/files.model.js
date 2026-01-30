import { runSql } from '../config/db.js';

export function getAllActiveFiles() {
  return runSql(`
    SELECT * FROM files
    WHERE is_active = 1
    ORDER BY created_at DESC
  `);
}

export function getFileById(id) {
  return runSql(
    `SELECT * FROM files WHERE id = ? LIMIT 1`,
    [id]
  );
}

export function incrementDownload(id) {
  return runSql(
    `UPDATE files SET downloads = downloads + 1 WHERE id = ?`,
    [id]
  );
}
