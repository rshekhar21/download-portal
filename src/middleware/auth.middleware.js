import jwt from 'jsonwebtoken';

/* =========================================================
   VERIFY AUTHENTICATION
   ========================================================= */

export function isAuthenticated(req, res, next) {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.redirect('/auth/login');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // attach user info to request
    next();
  } catch (err) {
    return res.redirect('/auth/login');
  }
}

/* =========================================================
   VERIFY ADMIN ROLE
   ========================================================= */

export function isAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).render('public/403', {
      title: 'Access Denied'
    });
  }
  next();
}
