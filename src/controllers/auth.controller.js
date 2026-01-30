import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { runSql } from '../config/db.js';

/* =========================================================
   SHOW LOGIN
   ========================================================= */

export function showLogin_old(req, res) {
  res.render('auth/login', {
    title: 'Admin Login',
    error: null,
    pageScript: null   // explicit (optional now)
  });
}

export async function showLogin(req, res, next) {
  try {
    const result = await runSql(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'admin'"
    );

    const hasAdmin = result[0].count > 0;

    res.render('auth/login', {
      title: 'Login',
      showSetup: !hasAdmin,
      error: null
    });
  } catch (err) {
    next(err);
  }
}


/* =========================================================
   HANDLE LOGIN
   ========================================================= */

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render('auth/login', {
        title: 'Admin Login',
        error: 'Email and password are required',
        pageScript: null
      });
    }

    const users = await runSql(
      `SELECT * FROM users WHERE email = ? AND is_active = 1 LIMIT 1`,
      [email]
    );

    if (!users.length) {
      return res.render('auth/login', {
        title: 'Admin Login',
        error: 'Invalid credentials',
        pageScript: null
      });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.render('auth/login', {
        title: 'Admin Login',
        error: 'Invalid credentials',
        pageScript: null
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.redirect('/admin/dashboard');
  } catch (err) {
    next(err);
  }
}

/* =========================================================
   SHOW REGISTER
   ========================================================= */

export function showRegister_(req, res) {
  res.render('auth/register', {
    title: 'Admin Registration',
    error: null,
    success: null,
    pageScript: null
  });
}

export async function showRegister(req, res, next) {
  const result = await runSql(
    "SELECT COUNT(*) AS count FROM users WHERE role = 'admin'"
  );

  if (result[0].count > 0) {
    return res.redirect('/auth/login');
  }

  res.render('auth/register', { title: 'Create Admin', error: null, success: null, pageScript: null });
}

/* =========================================================
   HANDLE REGISTER
   ========================================================= */

export async function register(req, res, next) {
  try {
    const { name, email, password, confirm_password } = req.body;

    if (!name || !email || !password || password !== confirm_password) {
      return res.render('auth/register', {
        title: 'Admin Registration',
        error: 'Invalid input',
        success: null,
        pageScript: null
      });
    }

    const hash = await bcrypt.hash(password, 10);

    await runSql(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (?, ?, ?, 'admin')`,
      [name, email, hash]
    );

    res.render('auth/register', {
      title: 'Admin Registration',
      error: null,
      success: 'Admin created successfully',
      pageScript: null
    });
  } catch (err) {
    next(err);
  }
}

/* =========================================================
   LOGOUT
   ========================================================= */

export function logout(req, res) {
  res.clearCookie('token');
  res.redirect('/');
}
