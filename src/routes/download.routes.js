import express from 'express';
import {
  showDownloads,
  downloadFile
} from '../controllers/download.controller.js';

const router = express.Router();

router.get('/', showDownloads);
router.get('/download/:id', downloadFile);

export default router;
