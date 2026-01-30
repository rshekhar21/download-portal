import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import expressLayouts from 'express-ejs-layouts';

import { pool } from './src/config/db.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================================================
   ES MODULE FIXESES
   ========================================================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================================================
   MIDDLEWARES
   ========================================================= */

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressLayouts);
app.set('layout', 'layout');

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

/* =========================================================
   STATIC FILES (PUBLIC ONLY)
   ========================================================= */

// app.use('/public', express.static(path.join(__dirname, 'src/public')));
app.use(express.static(path.join(process.cwd(), 'src/public')));
// console.log(path.join(process.cwd(), 'src/public'))

/* 
  IMPORTANT:
  Do NOT expose /assets directly.
  Files must be served via controller (res.download)
*/

/* =========================================================
   VIEW ENGINE
   ========================================================= */

app.set('views', path.join(__dirname, 'src/views'));
app.set('view engine', 'ejs');

/* =========================================================
   DATABASE CONNECTION TEST
   ========================================================= */

async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ MySQL connected successfully');
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  }
}

await testDbConnection();

app.use((req, res, next) => {
  res.locals.isAdminPage = req.path.startsWith('/admin');
  next();
});

/* =========================================================
   ROUTES
   ========================================================= */

// (to be created next)
import downloadRoutes from './src/routes/download.routes.js';
import authRoutes from './src/routes/auth.routes.js';
import adminRoutes from './src/routes/admin.routes.js';

app.use('/', downloadRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

/* =========================================================
   404 HANDLER
   ========================================================= */

app.use((req, res) => {
  res.status(404).render('public/404', {
    title: 'Page Not Found'
  });
});

/* =========================================================
   ERROR HANDLER
   ========================================================= */

app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).render('public/500', {
    title: 'Server Error'
  });
});

/* =========================================================
   START SERVER
   ========================================================= */

app.listen(PORT, () => {
  console.log(`
    🚀 ${process.env.APP_NAME} running on port ${PORT}

        Server:     http://localhost:${PORT}
    `);
});
