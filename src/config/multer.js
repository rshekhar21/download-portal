import multer from 'multer';
import path from 'path';
import fs from 'fs';

/* =========================================================
   ENSURE TEMP UPLOAD DIRECTORY EXISTS
   ========================================================= */

const uploadDir = path.join(process.cwd(), process.env.UPLOAD_TEMP_DIR || 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/* =========================================================
   STORAGE CONFIG
   ========================================================= */

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}_${safeName}`);
  }
});

/* =========================================================
   FILE FILTER (SECURITY)
   ========================================================= */

const allowedMimeTypes = [
  // Executables
  'application/octet-stream',
  'application/x-msdownload',
  'application/x-msdos-program',

  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/gzip',

  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

  // Images
  'image/jpeg',
  'image/png',
  'image/webp'
];

function fileFilter(req, file, cb) {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
}

/* =========================================================
   MULTER INSTANCE
   ========================================================= */

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE || 524288000) // 500MB
  }
});

export default upload;
