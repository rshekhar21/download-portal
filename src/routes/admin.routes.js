import express from 'express';
import {
  dashboard,
  showUploadForm,
  uploadFile
} from '../controllers/admin.controller.js';

import * as adminController from '../controllers/admin.controller.js'

import {
  isAuthenticated,
  isAdmin
} from '../middleware/auth.middleware.js';

// multer middleware (we'll create next)
import upload from '../config/multer.js';

const router = express.Router();

/* =========================================================
   ADMIN ROUTE PROTECTION
   ========================================================= */

router.use(isAuthenticated, isAdmin);

/* =========================================================
   ADMIN ROUTES
   ========================================================= */

router.get('/dashboard', dashboard);
router.get('/upload', showUploadForm);
router.post('/upload', upload.single('file'), uploadFile);

// files management
router.get('/files', adminController.listFiles);
router.get('/files/:id/edit', adminController.editFilePage);
router.post('/files/:id/edit', adminController.updateFile);

router.post('/files/:id/toggle', adminController.toggleFileStatus);
router.post('/files/:id/delete', adminController.deleteFile);

export default router;
