import fs from 'fs';
import path from 'path';
import { runSql } from '../config/db.js';

/* =========================================================
   ADMIN DASHBOARD
   ========================================================= */

export async function dashboard(req, res, next) {
  try {
    const stats = await runSql(`
      SELECT
        (SELECT COUNT(*) FROM files) AS total_files,
        (SELECT SUM(downloads) FROM files) AS total_downloads,
        (SELECT COUNT(*) FROM categories WHERE is_active = 1) AS categories
    `);

    const files = await runSql(`
      SELECT 
        f.id,
        f.title,
        f.downloads,
        f.is_active,
        f.created_at,
        c.name AS category
      FROM files f
      LEFT JOIN categories c ON c.id = f.category_id
      ORDER BY f.created_at DESC
      LIMIT 10
    `);

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      user: req.user,
      stats: stats[0],
      isAdminPage: true,
      files
    });
  } catch (err) {
    next(err);
  }
}

/* =========================================================
   SHOW UPLOAD FORM
   ========================================================= */

export async function showUploadForm(req, res, next) {
  try {
    const categories = await runSql(
      `SELECT id, name FROM categories WHERE is_active = 1`
    );

    res.render('admin/upload', {
      title: 'Upload File',
      categories,
      error: null
    });
  } catch (err) {
    next(err);
  }
}

/* =========================================================
   HANDLE FILE UPLOAD
   ========================================================= */

export async function uploadFile_(req, res, next) {
  try {
    if (!req.file) {
      return res.render('admin/upload', {
        title: 'Upload File',
        categories: [],
        error: 'No file selected'
      });
    }

    const {
      title,
      description,
      category_id
    } = req.body;

    const assetDir = path.join(
      process.cwd(),
      process.env.ASSETS_DIR,
      category_id || 'misc'
    );

    if (!fs.existsSync(assetDir)) {
      fs.mkdirSync(assetDir, { recursive: true });
    }

    const storedName = `${Date.now()}_${req.file.originalname}`;
    const finalPath = path.join(assetDir, storedName);

    fs.renameSync(req.file.path, finalPath);

    await runSql(
      `INSERT INTO files 
      (title, description, category_id, file_name, stored_name, file_path, mime_type, file_size, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        category_id || null,
        req.file.originalname,
        storedName,
        path.relative(process.cwd(), assetDir),
        req.file.mimetype,
        req.file.size,
        req.user.id
      ]
    );

    res.redirect('/admin/dashboard');
  } catch (err) {
    next(err);
  }
}

export async function uploadFile(req, res, next) {
  try {
    // ------------------------
    // Basic validation
    // ------------------------
    if (!req.file) {
      const categories = await runSql(
        'SELECT id, name FROM categories WHERE is_active = 1'
      );

      return res.render('admin/upload', {
        title: 'Upload File',
        categories,
        error: 'No file selected'
      });
    }

    const { title, description, category_id } = req.body;

    if (!title) {
      const categories = await runSql(
        'SELECT id, name FROM categories WHERE is_active = 1'
      );

      return res.render('admin/upload', {
        title: 'Upload File',
        categories,
        error: 'Title is required'
      });
    }

    // ------------------------
    // Resolve category folder
    // ------------------------
    let categoryFolder = 'misc';
    let resolvedCategoryId = null;

    if (category_id) {
      const rows = await runSql(
        'SELECT id, name FROM categories WHERE id = ? AND is_active = 1',
        [category_id]
      );

      if (rows.length) {
        resolvedCategoryId = rows[0].id;
        categoryFolder = rows[0].name;
      }
    }

    // ------------------------
    // Prepare storage path
    // ------------------------
    const assetDir = path.join(
      process.cwd(),
      process.env.ASSETS_DIR,
      categoryFolder
    );

    if (!fs.existsSync(assetDir)) {
      fs.mkdirSync(assetDir, { recursive: true });
    }

    // ------------------------
    // Move uploaded file
    // ------------------------
    const storedName = `${Date.now()}_${req.file.originalname}`;
    const finalPath = path.join(assetDir, storedName);

    fs.renameSync(req.file.path, finalPath);

    // ------------------------
    // Save metadata in DB
    // ------------------------
    await runSql(
      `INSERT INTO files
        (title, description, category_id, file_name, stored_name, file_path,
         mime_type, file_size, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        resolvedCategoryId,
        req.file.originalname,
        storedName,
        path.relative(process.cwd(), assetDir),
        req.file.mimetype,
        req.file.size,
        req.user.id
      ]
    );

    res.redirect('/admin/dashboard');
  } catch (err) {
    next(err);
  }
}

export async function listFiles(req, res, next) {
  try {
    const files = await runSql(`
      SELECT 
        f.id,
        f.title,
        f.downloads,
        f.is_active,
        f.created_at,
        c.name AS category
      FROM files f
      LEFT JOIN categories c ON c.id = f.category_id
      ORDER BY f.created_at DESC
    `);

    res.render('admin/files', {
      title: 'Manage Files',
      files
    });
  } catch (err) {
    next(err);
  }
}

export async function editFilePage(req, res, next) {
  try {
    const { id } = req.params;

    const [file] = await runSql(
      `SELECT * FROM files WHERE id = ?`,
      [id]
    );

    if (!file) {
      return res.redirect('/admin/files');
    }

    const categories = await runSql(
      `SELECT id, name FROM categories WHERE is_active = 1`
    );

    res.render('admin/file-edit', {
      title: 'Edit File',
      file,
      categories,
      error: null
    });
  } catch (err) {
    next(err);
  }
}

export async function updateFile(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, category_id } = req.body;

    await runSql(
      `UPDATE files
       SET title = ?, description = ?, category_id = ?
       WHERE id = ?`,
      [title, description, category_id || null, id]
    );

    res.redirect('/admin/files');
  } catch (err) {
    next(err);
  }
}

export async function toggleFileStatus(req, res, next) {
  try {
    const { id } = req.params;

    await runSql(
      `UPDATE files
       SET is_active = IF(is_active = 1, 0, 1)
       WHERE id = ?`,
      [id]
    );

    res.redirect('/admin/files');
  } catch (err) {
    next(err);
  }
}

export async function deleteFile(req, res, next) {
  try {
    const { id } = req.params;

    const [file] = await runSql(
      `SELECT file_path, stored_name FROM files WHERE id = ?`,
      [id]
    );

    if (file) {
      const fullPath = path.join(
        process.cwd(),
        file.file_path,
        file.stored_name
      );

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      await runSql(`DELETE FROM files WHERE id = ?`, [id]);
    }

    res.redirect('/admin/files');
  } catch (err) {
    next(err);
  }
}

