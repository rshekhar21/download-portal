import express from 'express';
import {
  showLogin,
  login,
  logout,
  showRegister,
  register
} from '../controllers/auth.controller.js';

const router = express.Router();

/* ===============================
   AUTH ROUTES
   =============================== */

router.get('/login', showLogin);
router.post('/login', login);
router.get('/logout', logout);

/* ===============================
   ADMIN REGISTRATION
   =============================== */

router.get('/register', showRegister);
router.post('/register', register);

export default router;
