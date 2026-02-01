import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { runSql } from '../config/db.js';

/* =========================================================
   ES MODULE FIX
   ========================================================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================================================
   SHOW DOWNLOAD LIST
   ========================================================= */

export async function showDownloads(req, res, next) {
  try {
    const files = await runSql(`
      SELECT 
        f.id,
        f.title,
        f.description,
        f.file_size,
        f.downloads,
        c.name AS category
      FROM files f
      LEFT JOIN categories c ON c.id = f.category_id
      WHERE f.is_active = 1
      ORDER BY f.title ASC
    `);

    res.render('public/index', {
      title: 'Downloads',
      files,
      pageScript: 'index.js',
      isAdminPage: false,
    });
  } catch (err) {
    next(err);
  }
}

/* =========================================================
   DOWNLOAD FILE
   ========================================================= */

export async function downloadFile(req, res, next) {
  try {
    const { id } = req.params;

    const rows = await runSql(
      `SELECT * FROM files WHERE id = ? AND is_active = 1 LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).render('public/404', {
        title: 'File not found'
      });
    }

    const file = rows[0];

    const filePath = path.join(
      __dirname,
      '../../',
      file.file_path,
      file.stored_name
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).render('public/404', {
        title: 'File missing on server'
      });
    }

    // Increment download count
    await runSql(
      `UPDATE files SET downloads = downloads + 1 WHERE id = ?`,
      [id]
    );

    // Log download
    await runSql(
      `INSERT INTO download_logs (file_id, ip_address, user_agent)
       VALUES (?, ?, ?)`,
      [id, req.ip, req.headers['user-agent']]
    );

    res.download(filePath, file.file_name);
  } catch (err) {
    next(err);
  }
}
